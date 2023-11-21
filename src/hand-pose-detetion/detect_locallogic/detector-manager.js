const DetectionType = require('./detection-type');
const Detector = require('./detector');
const MarkerDetector = require('./detector-aruco');
const QRCodeDetector = require('./detector-qrcode');
const FaceDetector = require('./detector-face');
const ColorDetector = require('./detector-color');
const HandposeDetector = require('./detector-handpose');
const HandPoseCamera = require('./handpose-camera');
const StageLayering = require('../../engine/stage-layering');

class DetectorManager {
    constructor (runtime) {
        this._runtime = runtime;
        this._detectors = {};
    }

    /**
     *
     */
    get isPrepare () {
        return FaceDetector.isPrepare;
    }

    get faceDetector () {
        return FaceDetector;
    }

    /**
     *
     */
    prepareDetector () {
        return Promise.all([
            FaceDetector.prepare()
        ]);
    }

    onStopAll () {
        this.diableDetectorAll()
        this.disableDetectedBoxAll();
    }

    _createDetector (type) {
        switch (type) {
            case DetectionType.MARKER:
                // return new MarkerDetector();
                return new HandposeDetector();
            case DetectionType.QRCODE:
                return new QRCodeDetector();
            case DetectionType.FACE:
                return new FaceDetector();
            case DetectionType.COLOR:
                return new ColorDetector();
                // HandposeDetector.runHandPose();
                
        }
    }

    _isExistDetector (type) {
        return type && this._detectors && this._detectors[type];
    }

    setEnable (type, enable) {
        if (enable) {
            this._enableDetector(type);
        } else {
            this._disableDetector(type);
        }
    }

    _enableDetector (type) {
        if (!this._renderer) {
            this._renderer = this._runtime.renderer;
        }

        if (!this._isExistDetector(type)) {
            this._detectors[type] = {
                detector: this._createDetector(type),
                detecting: false,
                result: null,
                skinId: -1,
                drawable: -1,
                canvas: null,
                context: null,
                enable: false,
                drawBox: false
                
            }
        }

        this._detectors[type].detector.enable();
        this._detectors[type].enable = true;
    }

    diableDetectorAll () {
        Object.entries(DetectionType).forEach(([key, type]) => {
            this._disableDetector(type);
        })
    }

    _disableDetector (type) {
        if (!this._isExistDetector(type)) {
            return;
        }

        this._disableDetectedBox(type);
        this._detectors[type].detector.disable();
        this._detectors[type].enable = false;
        this._detectors[type].result = null;
    }

    setDrawable (type, drawable, ghost = 50) {
        if (drawable) {
            this._enableDetectedBox(type, ghost);
        } else {
            this._disableDetectedBox(type);
        }
    }

    _enableDetectedBox (type, ghost = 50) {
        if (this._isExistDetector(type)) {
            const dt = this._detectors[type]
            if (!dt.enable) {
                return;
            }

            dt.drawBox = true;
            dt.canvas = document.createElement('canvas');
            dt.canvas.width = Detector.DIMENSIONS[0];
            dt.canvas.height = Detector.DIMENSIONS[1];
            dt.context = dt.canvas.getContext('2d');
            dt.ghost = ghost;

            if (dt.skinId === -1 && dt.drawable === -1) {
                dt.skinId = this._renderer.createBitmapSkin(new ImageData(...Detector.DIMENSIONS), 1);
                dt.drawable = this._renderer.createDrawable(StageLayering.IMAGE_PROCESSING_DETECTED_BOX_LAYER);
                this._renderer.updateDrawableSkinId(dt.drawable, dt.skinId);
            }

            this._renderer.updateDrawableEffect(dt.drawable, 'ghost', ghost);
            this._renderer.updateDrawableVisible(dt.drawable, true);
        }
    }

    disableDetectedBoxAll () {
        Object.entries(DetectionType).forEach(([key, type]) => {
            this._disableDetectedBox(type);
        });
    }

    _disableDetectedBox (type) {
        if (this._isExistDetector(type)) {
            const dt = this._detectors[type]
            dt.drawBox = false;

            delete dt.context;
            delete dt.canvas;

            if (dt.skinId !== -1 || dt.drawable !== -1) {
                this._renderer.destroyDrawable(dt.drawable, StageLayering.IMAGE_PROCESSING_DETECTED_BOX_LAYER);
                this._renderer.destroySkin(dt.skinId);

                dt.skinId = -1;
                dt.drawable = -1;
            }
        }
    }

    setPreviewGhost (ghost) {
        Object.entries(DetectionType).forEach(([key, type]) => {
            if (this._isExistDetector(type) && this._detectors[type].drawable !== -1) {
                this._detectors[type].ghost = ghost;
                this._renderer.updateDrawableEffect(this._detectors[type].drawable, 'ghost', ghost);
            }
        });
    }

    detectedResult (type) {
        if (this._isExistDetector(type)) {
            return this._detectors[type].result;
        }
    }

    setFrame (imageData) {
        if (!imageData) {
            return;
        }

        // 감지 타입별 감지 시작
        Object.entries(DetectionType).forEach(([key, type]) => {
            this._detect(type, imageData);
        });
    }

    async _detect (type, imageData) {
        // if (!this._isExistDetector(type) || !imageData) {
        //     return;
        // }
        console.log(type);
        const dt = this._detectors[type];
        console.log('dt: ', dt)
        // if (!dt.enable || dt.detecting) {
        //     return;
        // }

        dt.detecting = true;
        
            // 비디오에 손 좌표 그리기
        const handposeCamera = new HandPoseCamera();
        handposeCamera.enable();  // enable 메서드를 호출하여 _context를 초기화
        handposeCamera.drawCtx(imageData);
        
        const detector = await HandposeDetector._createDetector();
        const hands = await detector.estimateHands(imageData);
        console.log('hands: ', hands)
        if (hands && hands.length > 0) {
            handposeCamera.drawResults(hands);  // 손이 감지되면 drawResults() 함수를 사용하여 손의 위치를 시각화
        }

            // estimate hands 실행 
        HandposeDetector.detect(imageData);

        

        const hasResult = dt.result ? true : false;
        // dt.detector.detect(imageData).then( () => {
            
            // dt.result = result;
            // if (result) {  // for face-detector 
            //     // if (dt.drawBox) {
            //     //     dt.context.clearRect(0, 0, Detector.DIMENSIONS[0], Detector.DIMENSIONS[1]);
            //     //     dt.detector.draw(dt.canvas);
            //     //     this._renderer.updateBitmapSkin(dt.skinId, dt.canvas, 1);
            //     // }
            // } else if (dt.detector == 'HandPoseDetector') {




            // } else {
            //     // if (dt.drawBox && hasResult) {
            //     //     dt.context.clearRect(0, 0, Detector.DIMENSIONS[0], Detector.DIMENSIONS[1]);
            //     //     this._renderer.updateBitmapSkin(dt.skinId, dt.canvas, 1);
            //     // }
            // }
            // dt.detecting = false;
        // }).catch(e => {
        //     dt.detecting = false;
        // });
    }
}
module.exports = DetectorManager;
