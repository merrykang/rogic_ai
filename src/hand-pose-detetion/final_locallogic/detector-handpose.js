const {createDetector,SupportedModels} = require("@tensorflow-models/hand-pose-detection");
const Detector = require("./detector");

// 각 손가락을 폴리라인으로 렌더링
const fingerLookupIndices = {
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

    // 모델 로딩
    _createDetector() {
        const model = SupportedModels.MediaPipeHands;
        const detector = createDetector(model, {
            runtime: "tfjs",
            modelType: "lite",
            maxHands: 2, // or 2~10.
            detectorModelUrl:
                "/static/tensorflow-models/tfjs-model_handpose_3d_detector_lite_1/model.json",
            landmarkModelUrl:
                "/static/tensorflow-models/tfjs-model_handpose_3d_landmark_lite_1/model.json",
        });

        console.log("model loading success!, detector: ", this._detector);
        return detector;
    }
    
    detect(imageData) {
        if (!this._detector) {
            this._createDetector().then(detector => {
                this._detector = detector;
                console.log("model loading success!, detector: ", this._detector);
            })
        }

        return new Promise((resolve, reject) => {   
            this._detector.estimateHands(imageData).then(result => {
                this._result = result;
                console.log(`this._result: `, this._result);

                this._result.forEach((res) => {
                    console.log(`${res.handedness} hand keypoints:`);
                    res.keypoints.forEach((keypoint, i) => {
                        let x = keypoint.x - 320;
                        let y = keypoint.y - 240;
                        console.log(`Keypoint ${i}: [${x}, ${y}]`);
                    })
                })
                resolve(this._result);
            }).catch(e => {
                console.error(e);
            });
        })
    }

    draw(canvas) {
        if (!canvas || !this.isExistContent(this._result)) return canvas;
        this._result.forEach( (res) => {
            this._drawKeypoints(canvas, res.keypoints, res.handedness);
        });
        return canvas;
    }

    // 손의 키포인트 및 경로를 그리는 함수
    _drawKeypoints(canvas, keypoints, handedness) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = handedness === "Left" ? "Red" : "Blue";
        ctx.strokeStyle = "White";
        ctx.lineWidth = 2;

        keypoints.forEach(keypoint => {
            this._drawPoint(ctx, keypoint.y - 2, keypoint.x - 2, 3);
        });

        Object.keys(fingerLookupIndices).forEach(finger => {
            const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
            this._drawPath(canvas, points, false);
        });
    }

    // 키포인트 간 경로를 그리는 함수
    _drawPath(canvas, points, closePath) {
        const ctx = canvas.getContext("2d");
        const region = new Path2D();
        region.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(point => region.lineTo(point.x, point.y));
 
        if (closePath) {
            region.closePath();
        }
        ctx.stroke(region);
    }

    // 키포인트(x, y 좌표를 중심으로 한 반지름 r의 원)을 그리는 함수
    _drawPoint(ctx, y, x, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
    }
}

module.exports = HandposeDetector;
