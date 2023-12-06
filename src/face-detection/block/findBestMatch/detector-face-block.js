

class LabeledFaceDescriptors {
    constructor(label, descriptors) {
      if (!(typeof label === 'string')) {
        throw new Error('LabeledFaceDescriptors - constructor expected label to be a string')
      }
  
      if (!Array.isArray(descriptors) || descriptors.some(desc => !(desc instanceof Float32Array))) {
        throw new Error('LabeledFaceDescriptors - constructor expected descriptors to be an array of Float32Array')
      }
  
      this._label = label;
      this._descriptors = descriptors;
    }
  
    get label() { return this._label; }
    get descriptors() { return this._descriptors; }
  
    toJSON() {
      return {
        label: this.label,
        descriptors: this.descriptors.map(d => Array.from(d))
      };
    }
  
    static fromJSON(json) {
      const descriptors = json.descriptors.map(d => {
        return new Float32Array(d);
      });
      return new LabeledFaceDescriptors(json.label, descriptors);
    }
}

class FaceMatch {
    constructor(label, distance) {
      this._label = label;
      this._distance = distance;
    }
  
    get label() { return this._label; }
    get distance() { return this._distance; }
  
    _round(num, prec = 2) {
        const f = Math.pow(10, prec);
        return Math.floor(num * f) / f;
    }
  
    toString(withDistance = true) {
      return `${this.label}${withDistance ? ` (${this._round(this.distance)})` : ''}`;
    }
}
  
class FaceMatcher {
    constructor(inputs, distanceThreshold = 0.6) {
        this._distanceThreshold = distanceThreshold;
        const inputArray = Array.isArray(inputs) ? inputs : [inputs];
    
        if (!inputArray.length) {
          throw new Error(`FaceRecognizer.constructor - expected at least one input`);
        }
    
        let count = 1;
        const createUniqueLabel = () => `person ${count++}`;
    
        this._labeledDescriptors = inputArray.map((desc) => {
          if (desc instanceof LabeledFaceDescriptors) {
            return desc;
          }
    
          if (desc instanceof Float32Array) {
            return new LabeledFaceDescriptors(createUniqueLabel(), [desc]);
          }
    
          if (desc.descriptor && desc.descriptor instanceof Float32Array) {
            return new LabeledFaceDescriptors(createUniqueLabel(), [desc.descriptor]);
          }
    
          throw new Error(`FaceRecognizer.constructor - expected inputs to be of type Array`)
        });
    }
    
    _euclideanDistance(arr1, arr2) {
        if (arr1.length !== arr2.length)
            throw new Error('euclideanDistance: arr1.length !== arr2.length')

        const desc1 = this._normalize(Array.from(arr1));
        const desc2 = this._normalize(Array.from(arr2));

        return Math.sqrt(
            desc1
                .map((val, i) => val - desc2[i])
                .reduce((res, diff) => res + Math.pow(diff, 2), 0)
        )
    }

    _normalize(arr) {
        const maxVal = Math.max(...arr);
        const minVal = Math.min(...arr);
    
        return arr.map(val => (val - minVal) / (maxVal - minVal));
    }

    get labeledDescriptors() { return this._labeledDescriptors; }
    get distanceThreshold() { return this._distanceThreshold; }

    computeMeanDistance(queryDescriptor, descriptors) {
        return descriptors
            .map(d => this._euclideanDistance(d, queryDescriptor))
            .reduce((d1, d2) => d1 + d2, 0) / (descriptors.length || 1);
    }

    matchDescriptor(queryDescriptor) {
        return this.labeledDescriptors
            .map(({ descriptors, label }) => new FaceMatch(label, this.computeMeanDistance(queryDescriptor, descriptors)))
            .reduce((best, curr) => best.distance < curr.distance ? best : curr);
    }

    findBestMatch(queryDescriptor) {
        const bestMatch = this.matchDescriptor(queryDescriptor);
        console.log('this.distanceThreshold', this.distanceThreshold)
        // return bestMatch
    return bestMatch.distance <= this.distanceThreshold
        ? bestMatch
        : new FaceMatch('unknown', bestMatch.distance);
    }

    toJSON() {
        return {
            distanceThreshold: this.distanceThreshold,
            labeledDescriptors: this.labeledDescriptors.map((ld) => ld.toJSON())
        };
    }

    static fromJSON(json) {
        const labeledDescriptors = json.labeledDescriptors
            .map((ld) => LabeledFaceDescriptors.fromJSON(ld));
        return new FaceMatcher(labeledDescriptors, json.distanceThreshold);
    }
}

module.exports = {
    LabeledFaceDescriptors,
    FaceMatcher
};
  