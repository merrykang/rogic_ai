const { createDetector, SupportedModels, util } = require('@tensorflow-models/pose-detection');
const Detector = require("./detector");

const scoreThreshold = 0.65;

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
        const model = SupportedModels.BlazePose;
        const detector = createDetector(model, {
            runtime: 'tfjs',
            maxPoses: 2,
            enableSmoothing: true,
            modelType: 'lite',
            detectorModelUrl: '/static/tensorflow-models/pose_detection_detector/model.json',
            landmarkModelUrl: '/static/tensorflow-models/pose_detection_landmark_lite/model.json'
        })
        return detector;
    }

    async detect(imageData) {
        if (!this._detector) {
            this._detector = await this._createDetector();
            console.log("model loading success!, detector: ", this._detector);
        }
        const timestamp = performance.now();
        this._result = await this._detector.estimatePoses(imageData, timestamp);
        console.log('this._result: ', this._result);

        for (let i = 0; i < this._result.length; i++) {
            console.log(`============================= ${i+1} 번째 포즈 =============================`);
            const keypoints = this._result[i].keypoints;
            for (let j = 0; j < keypoints.length; j++) {
                if (keypoints[j].name != undefined) {
                    let x = keypoints[j].x - 320;
                    let y = keypoints[j].y - 240;
                    console.log(`${keypoints[j].name}: [${x}, ${y}]`);
                }  
            }
        }
        return this._result;
    }

    draw(canvas) {
        if (!canvas || !this.isExistContent(this._result)) return canvas;
        const ctx = canvas.getContext("2d");
        const keypoints = this._result[0].keypoints;

        if (keypoints != null) {
            // Draw keypoints
            const keypointIndices = util.getKeypointIndexBySide(SupportedModels.BlazePose);
            const colors = ['Red', 'Green', 'Orange'];
            const keypointBySide = [keypointIndices.middle, keypointIndices.left, keypointIndices.right];
            ctx.strokeStyle = 'White';
            ctx.lineWidth = 2;
            keypointBySide.forEach((keypointSide, index) => {
                ctx.fillStyle = colors[index];
                keypointSide.forEach(i => this._drawPoint(ctx, keypoints[i]));
            });

            // Draw path
            ctx.fillStyle = 'White';
            ctx.strokeStyle = 'White';
            ctx.lineWidth = 2;
            const adjacentPairs = util.getAdjacentPairs(SupportedModels.BlazePose);
            adjacentPairs.forEach(([i, j]) => this._drawPath(ctx, keypoints[i], keypoints[j]));
        }
        return canvas;
    }

    _drawPoint(ctx, keypoint) {
        const score = keypoint.score != null ? keypoint.score : 1;
        if (score >= scoreThreshold) {
        const circle = new Path2D();
        circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
        ctx.fill(circle);
        ctx.stroke(circle);
        }

    }

    _drawPath(ctx, keypoint1, keypoint2) {
        const score1 = keypoint1.score != null ? keypoint1.score : 1;
        const score2 = keypoint2.score != null ? keypoint2.score : 1;
        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
            ctx.beginPath();
            ctx.moveTo(keypoint1.x, keypoint1.y);
            ctx.lineTo(keypoint2.x, keypoint2.y);
            ctx.stroke();
        }
    }
}

module.exports = PoseDetector;