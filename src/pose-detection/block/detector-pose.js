const { createDetector, SupportedModels, util } = require('@tensorflow-models/pose-detection');
const Detector = require("./detector");

const SCORE_THRESHOLD = 0.65;
const MODEL = SupportedModels.BlazePose;

class PoseDetector extends Detector {
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
        const detector = createDetector(MODEL, {
            runtime: 'tfjs',
            maxPoses: 1,
            flipHorizontal: false,
            enableSmoothing: true,
            enableSegmentation: true, 
            smoothSegmentation: true,
            modelType: 'lite',
            detectorModelUrl: '/static/tensorflow-models/pose_detection_detector/model.json',
            landmarkModelUrl: '/static/tensorflow-models/pose_detection_landmark_lite/model.json'
        })
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
            const timestamp = performance.now();
            this._detector.estimatePoses(imageData, timestamp).then(result => {
                this._result = result;
                console.log(`this._result: `, this._result);
                resolve(this._result);
            }).catch(e => {
                reject(e);
            });
        })
    }

    draw(canvas) {
        if (!canvas || !this.isExistContent(this._result)) return canvas;
        const ctx = canvas.getContext("2d");
        const keypoints = this._result[0].keypoints;

        if (keypoints) {
            // Draw keypoints
            const keypointIndices = util.getKeypointIndexBySide(MODEL);
            const colors = ['Red', 'Green', 'Orange'];
            const keypointBySide = [keypointIndices.middle, keypointIndices.left, keypointIndices.right];
            ctx.strokeStyle = 'White';
            ctx.lineWidth = 2;
            keypointBySide.forEach((keypointSide, index) => {
                ctx.fillStyle = colors[index];
                keypointSide.forEach(i => this._drawKeypoint(ctx, keypoints[i]));
            });

            // Draw path
            const adjacentPairs = util.getAdjacentPairs(MODEL);
            ctx.fillStyle = 'White';
            ctx.strokeStyle = 'White';
            ctx.lineWidth = 2;
            adjacentPairs.forEach(([i, j]) => this._drawPath(ctx, keypoints[i], keypoints[j]));
        }
        return canvas;
    }

    _drawKeypoint(ctx, keypoint) {
        const score = keypoint.score != null ? keypoint.score : 1;
        if (score >= SCORE_THRESHOLD) {
            const circle = new Path2D();
            circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
            ctx.fill(circle);
            ctx.stroke(circle);
        }
    }

    _drawPath(ctx, keypoint1, keypoint2) {
        const score1 = keypoint1.score != null ? keypoint1.score : 1;
        const score2 = keypoint2.score != null ? keypoint2.score : 1;
        if (score1 >= SCORE_THRESHOLD && score2 >= SCORE_THRESHOLD) {
            ctx.beginPath();
            ctx.moveTo(keypoint1.x, keypoint1.y);
            ctx.lineTo(keypoint2.x, keypoint2.y);
            ctx.stroke();
        }
    }
}

module.exports = PoseDetector;