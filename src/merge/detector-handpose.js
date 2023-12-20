const {createDetector,SupportedModels} = require("@tensorflow-models/hand-pose-detection");
const Detector = require("./detector");

const FINGER_INDICES = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20],
};

class HandposeDetector extends Detector {
    constructor() {
        super();
        this._result;
    }

    enable() {
        super.enable();
        this._canvas = document.createElement("canvas");
        this._canvas.width = Detector.DIMENSIONS[0];
        this._canvas.height = Detector.DIMENSIONS[1];
        this._context = this._canvas.getContext("2d");
    }

    disable() {
        super.disable();
        delete this._context;
        delete this._canvas;
        this._context = null;
        this._canvas = null;
    }

    _createDetector() {
        const model = SupportedModels.MediaPipeHands;
        const detector = createDetector(model, {
            runtime: "tfjs",
            modelType: "lite",
            maxHands: 2, // or 2~10.
            flipHorizontal: false,
            staticImageMode: false,
            detectorModelUrl:
                "/static/tensorflow-models/tfjs-model_handpose_3d_detector_lite_1/model.json",
            landmarkModelUrl:
                "/static/tensorflow-models/tfjs-model_handpose_3d_landmark_lite_1/model.json",
        });
        return detector;
    }

    _detectHands(imageData) {
        if (!this._detector) {
            return this._createDetector().then(detector => {
                this._detector = detector;
                console.log("model loading success!, detector: ", this._detector);
                return this._detector.estimateHands(imageData);
            })
        } else {
            return this._detector.estimateHands(imageData);
        }
    }
    
    detect(imageData) {
        return new Promise((resolve, reject) => {   
            this._detectHands(imageData).then(detected => {
                this._result = detected;
                console.log(`this._result of handpose: `, this._result);
                resolve(this._result);
            }).catch(e => {
                console.log(e);
            });
        })
    }

    draw(canvas) {
        if (!canvas || !this.isExistContent(this._result)) return canvas;
        const ctx = canvas.getContext("2d");
        if (this._result) {
            this._result.forEach( (res) => {
                ctx.fillStyle = res.handedness === "Left" ? "Red" : "Blue";
                ctx.strokeStyle = "White";
                ctx.lineWidth = 2;
                res.keypoints.forEach(keypoint => {
                    this._drawKeypoint(ctx, keypoint);
                });
                Object.keys(FINGER_INDICES).forEach(finger => {
                    const points = FINGER_INDICES[finger].map(idx => res.keypoints[idx]);
                    this._drawPath(ctx, points, false);
                });
            });
        }
        return canvas;
    }

    _drawKeypoint(ctx, keypoint) {
        ctx.beginPath();
        ctx.arc(keypoint.x - 2, keypoint.y - 2, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    _drawPath(ctx, points, closePath) {
        const region = new Path2D();
        region.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(point => region.lineTo(point.x, point.y));
        if (closePath) {
            region.closePath();
        }
        ctx.stroke(region);
    }
}

module.exports = HandposeDetector;
