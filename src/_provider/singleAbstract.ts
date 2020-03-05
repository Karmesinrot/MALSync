import * as definitions from './definitions';

export abstract class SingleAbstract {

  constructor(
    protected url: string
  ) {
    this.handleUrl(url);
    return this;
  }

  protected type: definitions.type|null = null;

  protected persistanceState;
  protected undoState;

  protected ids = {
    mal: NaN,
    ani: NaN,
    kitsu: NaN,
    simkl: NaN,
  };

  protected abstract handleUrl(url: string);

  public getType() {
    return this.type
  }

  public abstract getCacheKey();

  abstract _setStatus(status: definitions.status): void;
  public setStatus(status: definitions.status): SingleAbstract {
    this._setStatus(status);
    return this;
  };

  abstract _getStatus(): definitions.status|number;
  public getStatus(): definitions.status {
    if(!this.isOnList()) return definitions.status.NoState;
    return this._getStatus();
  };

  abstract _setScore(score: definitions.score): void;
  public setScore(score: definitions.score): SingleAbstract {
    this._setScore(score);
    return this;
  };

  abstract _getScore(): definitions.score;
  public getScore(): definitions.score {
    return this._getScore();
  };

  abstract _setEpisode(episode: number): void;
  public setEpisode(episode: number): SingleAbstract {
    this._setEpisode(episode);
    return this;
  };

  abstract _getEpisode(): number;
  public getEpisode(): number {
    return this._getEpisode();
  };

  abstract _setVolume(volume: number): void;
  public setVolume(volume: number): SingleAbstract {
    this._setVolume(volume);
    return this;
  };

  abstract _getVolume(): number;
  public getVolume(): number {
    return this._getVolume();
  };

  abstract _setStreamingUrl(streamingUrl: string): void;
  public setStreamingUrl(streamingUrl: string): SingleAbstract {
    this._setStreamingUrl(streamingUrl);
    return this;
  };

  abstract _getStreamingUrl(): string;
  public getStreamingUrl(): string {
    return this._getStreamingUrl();
  };

  abstract _update(): Promise<void>;
  public update(): Promise<void> {
    con.log('[SINGLE]','Update info', this.ids);
    return this._update()
      .then(() => {
        this.persistanceState = this.getStateEl();
      });
  };

  abstract _sync(): Promise<void>;
  public sync(): Promise<void> {
    con.log('[SINGLE]','Sync', this.ids);
    return this._sync()
      .then(() => {
        this.undoState = this.persistanceState;
      });
  };

  public undo(): Promise<void> {
    if(!this.undoState) throw new Error('No undo state found');
    this.setStateEl(this.undoState);
    return this.sync()
      .then(() => {
        this.undoState = null;
      });
  }

  abstract _getTitle(): string;
  public getTitle() {
    return this._getTitle();
  }

  abstract _getTotalEpisodes(): number;
  public getTotalEpisodes() {
    return this._getTotalEpisodes();
  }

  abstract _getTotalVolumes(): number;
  public getTotalVolumes() {
    return this._getTotalVolumes();
  }

  protected _onList: boolean = false;
  public isOnList() {
    return this._onList;
  }

  protected _authenticated: boolean = false;
  public isAuthenticated() {
    return this._authenticated;
  }

  abstract _getDisplayUrl(): string;
  public getDisplayUrl(): string{
    return this._getDisplayUrl();
  }

  public getMalUrl(): string|null{
    if(!isNaN(this.ids.mal)){
      return 'https://myanimelist.net/'+this.getType()+'/'+this.ids.mal+'/'+encodeURIComponent(this.getTitle().replace(/\//,'_'));
    }
    return null;
  }

  abstract _getImage(): Promise<string>|string;
  public getImage(): Promise<string>|string{
    return this._getImage();
  }

  abstract _getRating(): Promise<string>|string;
  public getRating(): Promise<string>|string{
    var rating = this._getRating();
    if(!rating) return 'N/A';
    return rating;
  }

  public setResumeWaching(url:string, ep:number){
    return utils.setResumeWaching(url, ep, this.type, this.getCacheKey());
  }

  public getResumeWaching():Promise<{url:string, ep:number}>{
    return utils.getResumeWaching(this.type, this.getCacheKey())
  }

  public setContinueWaching(url:string, ep:number){
    return utils.setContinueWaching(url, ep,this.type, this.getCacheKey())
  }

  public getContinueWaching():Promise<{url:string, ep:number}>{
    return utils.getContinueWaching(this.type, this.getCacheKey())
  }

  getStateEl() {
    return {
      episode: this.getEpisode(),
      volume: this.getVolume(),
      status: this.getStatus(),
      score: this.getScore(),
    }
  }

  setStateEl(state) {
    this.setEpisode(state.episode);
    this.setVolume(state.volume);
    this.setStatus(state.status);
    this.setScore(state.score);
  }

  public async checkSync(episode: number, volume?: number, isNovel: boolean = false): Promise<boolean>{
    var curEpisode = this.getEpisode();
    var curStatus = this.getStatus();
    var curVolume = this.getVolume();

    if(curStatus === definitions.status.Completed) {
      if(episode === 1) {
        return this.startRewatchingMessage();
      }else{
        return false;
      }
    }

    if(
      curEpisode >= episode &&
      // Novel Volume
      !(
        isNovel &&
        typeof(volume) != "undefined" &&
        volume > curVolume
      )
    ){
      return false;
    }

    if(curEpisode && curEpisode === this.getTotalEpisodes()){
      if(curStatus === definitions.status.Rewatching) {
        await this.finishRewatchingMessage();
      }else{
        await this.finishWatchingMessage();
      }
      return true;
    }

    if(curStatus !== definitions.status.Watching && curStatus !== definitions.status.Rewatching) {
      return this.startWatchingMessage();
    }

    return true;
  }

  public async startWatchingMessage(): Promise<boolean> {
    return utils.flashConfirm(api.storage.lang("syncPage_flashConfirm_start_"+this.getType()), 'add')
      .then((res) => {
        if(res) this.setStatus(definitions.status.Watching);
        return res;
      })
  }

  public async finishWatchingMessage(): Promise<boolean> {
    var currentScore = this.getScore();
    return utils.flashConfirm(api.storage.lang("syncPage_flashConfirm_complete")+
        `<div><select id="finish_score" style="margin-top:5px; color:white; background-color:#4e4e4e; border: none;">
        <option value="0" ${(!currentScore) ? 'selected' : ''}>${api.storage.lang("UI_Score_Not_Rated")}</option>
        <option value="10" ${(currentScore == 10) ? 'selected' : ''}>${api.storage.lang("UI_Score_Masterpiece")}</option>
        <option value="9" ${(currentScore == 9) ? 'selected' : ''}>${api.storage.lang("UI_Score_Great")}</option>
        <option value="8" ${(currentScore == 8) ? 'selected' : ''}>${api.storage.lang("UI_Score_VeryGood")}</option>
        <option value="7" ${(currentScore == 7) ? 'selected' : ''}>${api.storage.lang("UI_Score_Good")}</option>
        <option value="6" ${(currentScore == 6) ? 'selected' : ''}>${api.storage.lang("UI_Score_Fine")}</option>
        <option value="5" ${(currentScore == 5) ? 'selected' : ''}>${api.storage.lang("UI_Score_Average")}</option>
        <option value="4" ${(currentScore == 4) ? 'selected' : ''}>${api.storage.lang("UI_Score_Bad")}</option>
        <option value="3" ${(currentScore == 3) ? 'selected' : ''}>${api.storage.lang("UI_Score_VeryBad")}</option>
        <option value="2" ${(currentScore == 2) ? 'selected' : ''}>${api.storage.lang("UI_Score_Horrible")}</option>
        <option value="1" ${(currentScore == 1) ? 'selected' : ''}>${api.storage.lang("UI_Score_Appalling")}</option>
        </select>
        </div>`, 'complete')
      .then((res) => {
        if(res) {
          this.setStatus(definitions.status.Completed);
          if(j.$("#finish_score").val() !== undefined && j.$("#finish_score").val() > 0) {
            con.log("finish_score: " + j.$('#finish_score :selected').val());
            this.setScore(j.$("#finish_score :selected").val());
          }
        }

        return res;
      })
  }

  public async startRewatchingMessage(): Promise<boolean> {
    return utils.flashConfirm(api.storage.lang("syncPage_flashConfirm_rewatch_finish_"+this.getType()), 'add')
      .then((res) => {
        if(res) this.setStatus(definitions.status.Rewatching);
        return res;
      })
  }

  public async finishRewatchingMessage(): Promise<boolean> {
    return utils.flashConfirm(api.storage.lang("syncPage_flashConfirm_rewatch_finish_"+this.getType()), 'complete')
      .then((res) => {
        if(res) this.setStatus(definitions.status.Completed);
        return res;
      })
  }

  protected errorObj(code: definitions.errorCode, message): definitions.error {
    return {
      code,
      message,
    }
  }

}
