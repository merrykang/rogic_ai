class Detector {
    constructor () { }

    static get DIMENSIONS () {
        return [480, 360];
    }

    /**
     *  감지 기능에서 필요한 내용이 준비된 경우
     *  static get isPrepare () {return true;}
     */

    /**
     *  감지 기능에서 필요한 내용 불러오거나 준비하는 함수
     *  static prepare () { }
     */

    enable () {
        this._enable = true;
    }

    disable () {
        this._enable = false;
        this._result = null;
    }

    detect (imageData) { }

    isExistContent (result) {
        return result && result.length > 0;
    }

    draw (canvas) { }
}
module.exports = Detector;
