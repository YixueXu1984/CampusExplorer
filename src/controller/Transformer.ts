import {ITransformationObject} from "../model/TransformationObject";
import {IApplyObject} from "../model/ApplyObject";
import {APPLY_TOKEN} from "./Enums";
import {Decimal} from "decimal.js";

export default class Transformer {
    constructor() {
        // constructor
    }

    public applyTransformations(result: any[], transformations: ITransformationObject): any[] {
        let transformationResult: any[] = [];
        let groups: Map<string, any[]> = this.groupBy(result, transformations.groupKeys);
        let groupsIterator = groups.entries();
        // for each apply object has to be used on each group

        for (let group of groupsIterator) {
            transformationResult.push(this.applyEachGroup(group, transformations.applyObjects));
        }
        return transformationResult;
    }

    private applyEachGroup(group: any[], applyObjects: IApplyObject[]): any {
        let groupObject: any = JSON.parse(group[0]);

        applyObjects.forEach((applyObject) => {
            groupObject[applyObject.applyKey] = this.applyFunction(group[1], applyObject);
        });

        return groupObject;
    }

    private groupBy(result: any[], groupKeys: string[]): Map<string, any[]> {
        let groups = new Map<string, any[]>();
        result.forEach((data) => {
            let group: any = {};
            // creates a group object
            for (let key of groupKeys) {
                group[key] = data[key];
            }

            // if group is not in groups map, create new group with curr data
            // if it i in groups map, push the curr data to that group
            let groupKey = JSON.stringify(group);
            if (!groups.has(groupKey)) {
                groups.set(groupKey, [data]);
            } else {
                groups.get(groupKey).push(data);
            }
        });
        return groups;
    }

    private applyFunction(result: any[], applyObject: IApplyObject): number {
        switch (applyObject.applyToken) {
            case APPLY_TOKEN.Emax:
                return this.applyMax(result, applyObject);
            case APPLY_TOKEN.Emin:
                return this.applyMin(result, applyObject);
            case APPLY_TOKEN.Ecount:
                return this.applyCount(result, applyObject);
            case APPLY_TOKEN.Esum:
                return this.applySum(result, applyObject);
            case APPLY_TOKEN.Eavg:
                return this.applyAvg(result, applyObject);
            default:
                throw new Error("Something went wrong, should not reach here");
        }

    }

    private applyMax(groupResult: any[], applyObject: IApplyObject): number {
        let maxValue: number = -Infinity;
        // find the maxValue of the given key in data
        groupResult.forEach((data) => {
            if (data[applyObject.key] > maxValue) {
                maxValue = data[applyObject.key];
            }
        });

        return maxValue;
    }

    private applyMin(groupResult: any[], applyObject: IApplyObject): number {
        let minValue: number = Infinity;
        // find the maxValue of the given key in data
        groupResult.forEach((data) => {
            if (data[applyObject.key] < minValue) {
                minValue = data[applyObject.key];
            }
        });

        return minValue;
    }

    private applyCount(groupResult: any[], applyObject: IApplyObject): number {
        let uniqueSet: Set<number | string> = new Set();
        groupResult.forEach((data) => {
            uniqueSet.add(data[applyObject.key]);
        });
        return uniqueSet.size;
    }

    private applySum(groupResult: any[], applyObject: IApplyObject): number {
        let sumValue: number = 0;
        groupResult.forEach((data) => {
                sumValue = sumValue + data[applyObject.key];
            }
        );
        return Number(sumValue.toFixed(2));
    }

    private applyAvg(groupResult: any[], applyObject: IApplyObject): number {
        let sum = new Decimal(0);
        groupResult.forEach((data) => {
            sum = sum.add(data[applyObject.key]);
        });
        let avgValue = sum.toNumber() / groupResult.length;
        return Number(avgValue.toFixed(2));
    }
}
