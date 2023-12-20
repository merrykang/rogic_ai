const { createDetector, SupportedModels, util } = require('@tensorflow-models/face-landmarks-detection');
const Detector = require("./detector");
const { LabeledFaceDescriptors, FaceMatcher } = require('./detector-face-block')

var user = {};
var faceMatcher = null;
const MODEL = SupportedModels.MediaPipeFaceMesh;

class FaceDetector extends Detector {
    constructor() {
        super();
        this._result;
        this._detector;
    }
    
    static get userList () {
        return Object.keys(user);
    }

    static get distance () {
        return 0.7;
    }
    
    static singleFaceDescriptor(element) {
        const faceDetector = new FaceDetector();
        return faceDetector._detectFaces(element).then(result => {
            const keypointsArray = result[0].keypoints.flatMap(keypoint => [keypoint.x, keypoint.y, keypoint.z])
            const descriptor = new Float32Array(keypointsArray);
            return Promise.resolve(descriptor);
        })
    }

    static setUserFace(name, descriptors) {
        if (!name) {return;}
        if (descriptors && descriptors.length > 0) {
            user[name] = descriptors;
        } else {
            if (name in user) {
                delete user[name];
            }
        }

        const keys = this.userList;
        if (keys && keys.length > 0) {
            const labelDescriptors = keys.map(key => new LabeledFaceDescriptors(key, user[key]))
            if (labelDescriptors) {
                faceMatcher = !user || this.userList.length === 0 ? null : new FaceMatcher(labelDescriptors, FaceDetector.distance);
            }
        } else {
            faceMatcher = null;
        }
    }

    /**
     * face-landmarks-detecion
     */
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
            maxFaces: 5,
            flipHorizontal: false,
            refineLandmarks: false,
            staticImageMode: true,
            detectorModelUrl: '/static/tensorflow-models/face_detection_short/model.json',
            landmarkModelUrl: '/static/tensorflow-models/face_landmarks_detection/model.json'
        })
        return detector;
    }

    _detectFaces(imageData) {
        if (!this._detector) {
            return this._createDetector().then(detector => {
                this._detector = detector;
                console.log("model loading success!, detector: ", this._detector);
                return this._detector.estimateFaces(imageData);
            })
        } else {
            return this._detector.estimateFaces(imageData);
        }
    }

    detect(imageData) {
        return new Promise((resolve, reject) => {   
            this._detectFaces(imageData).then(detected => {
                this._result = detected;
                console.log(`this._result of face: `, this._result);
                if (faceMatcher) {
                    const keypointArray = this._result[0].keypoints.flatMap(keypoint => [keypoint.x, keypoint.y, keypoint.z])
                    const descriptor = new Float32Array(keypointArray);
                    const results = faceMatcher.findBestMatch(descriptor);
                    this._result[0].id = results._label
                }
                resolve(this._result);
            })
        }).catch(e => {
            console.log(e);
        });
    }

    draw(canvas) {
        if (!canvas || !this.isExistContent(this._result)) return canvas;
        const ctx = canvas.getContext("2d");
        if (this._result) {
            this._result.forEach(result => {

                // Draw bounding box
                const isUnknown = (result.id === 'unknown') ? true : false;
                if (result.box) {
                    ctx.strokeStyle = isUnknown ? 'blue' : 'red';
                    ctx.lineWidth = 3;
                    const box = result.box;
                    this._drawPath(
                        ctx,
                        [[box.xMin, box.yMin], [box.xMax, box.yMin], [box.xMax, box.yMax],[box.xMin, box.yMax]],
                        true);
                }
                
                // Draw nose
                const keypoints = result.keypoints.map((keypoint) => [keypoint.x, keypoint.y]);
                const noseIndices = [8, 168, 6, 197, 195, 5, 4, 19, 94, 2];
                this._drawKeypoint(ctx, keypoints, noseIndices, "#ED5AB3");
    
                // Draw other parts
                const contours = util.getKeypointIndexByContour(MODEL);
                for (const [label, contour] of Object.entries(contours)) {
                    if (label !== 'leftIris' && label !== 'rightIris') {
                        this._drawKeypoint(ctx, keypoints, contour, "#ED5AB3");
                    }          
                }
            });
        }
        return canvas;
    }

    _drawKeypoint(ctx, keypoints, indices, color) {
        const points = indices.map((index) => keypoints[index]);
        if (points.every(value => value != undefined)) {
            ctx.fillStyle = color;
            points.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 3 /* radius */, 0, 2 * Math.PI);
                ctx.fill();
            });
            ctx.strokeStyle = '#45FFCA';  
            ctx.lineWidth = 1.3;
            this._drawPath(ctx, points, false);
        }
    }

    _drawPath(ctx, points, closePath) {
        const region = new Path2D();
        region.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            region.lineTo(point[0], point[1]);
        }
        if (closePath) {
            region.closePath();
        }
        ctx.stroke(region);
    }
}

module.exports = FaceDetector;
