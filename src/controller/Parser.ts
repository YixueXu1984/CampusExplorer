import {INode} from "../model/Node";
import Log from "../Util";
import Validator from "./Validator";
import {InsightDatasetKind} from "./IInsightFacade";

export default class Parser {
    private readonly dataSetToQueryId: string;
    private readonly dataSetToQueryType: InsightDatasetKind;
    private validator: Validator;

    constructor(dataSetToQueryId: string, dataSetToQueryType: InsightDatasetKind) {
        // Log.trace("Parser created");
        this.dataSetToQueryId = dataSetToQueryId;
        this.dataSetToQueryType = dataSetToQueryType;
        this.validator = new Validator();
    }

    public parseFilters(body: any): INode {
        let root = this.createNode("WHERE", "", "");
        this.parseFiltersHelper(Object.keys(body), Object.values(body), root.childNodes);
        return root;
    }

    private parseFiltersHelper(filterNames: string[], filterBody: any[], nodes: INode[]) {
        let i = 0;
        for (let filterName of filterNames) {
            let key: string = "";
            let input: string | number = "";
            if (this.validator.isMcomp(filterName) || this.validator.isScomp(filterName)) {
                key = this.extractKey(Object.keys(filterBody[i]));
                input = this.extractInputValue(Object.values(filterBody[i]));
            }

            if (this.validator.isMcomp(filterName)
                && this.validator.validateKey(key, filterName, this.dataSetToQueryType)
                && this.validator.validateInputValue(input, filterName)) {
                nodes.push(this.createNode(filterName, key, input));
            } else if (this.validator.isScomp(filterName)
                && this.validator.validateKey(key, filterName, this.dataSetToQueryType)
                && this.validator.validateInputValue(input, filterName)) {
                nodes.push(this.createNode(filterName, key, input));
            } else if (this.validator.isAnd(filterName) && this.validator.validateLcomp(filterBody[i])) {
                let newNode = this.createNode(filterName, "", "");
                nodes.push(newNode);
                for (let filters of filterBody[i]) {
                    this.parseFiltersHelper(Object.keys(filters), Object.values(filters), newNode.childNodes);
                }
            } else if (this.validator.isOr(filterName) && this.validator.validateLcomp(filterBody[i])) {
                let newNode = this.createNode(filterName, "", "");
                nodes.push(newNode);
                for (let filters of filterBody[i]) {
                    this.parseFiltersHelper(Object.keys(filters), Object.values(filters), newNode.childNodes);
                }
            } else if (this.validator.isNeg(filterName) && this.validator.validateNeg(filterBody[i])) {
                let newNode = this.createNode(filterName, "", "");
                nodes.push(newNode);
                let filter = filterBody[i];
                this.parseFiltersHelper(Object.keys(filter), Object.values(filter), newNode.childNodes);

            } else {
                throw new Error("Invalid filter format");
            }
            i = i + 1;
        }

    }

    private createNode(filterName: string, key: string, filterValue: string | number): INode {
        let node: INode = {
            filterName,
            key,
            filterValue,
            childNodes: []
        };
        return node;
    }

    private extractKey(keys: string[]): string {
        let key: string = "";
        if (keys.length !== 1) {
            throw new Error("multiple key inside filter");
        } else {
            key = keys[0];
        }

        let dataSetId: string;
        let dataSetKey: string;
        let keyArrHolder: string[] = key.split("_");
        dataSetId = keyArrHolder[0];
        dataSetKey = keyArrHolder[1];

        if (dataSetId === undefined || dataSetKey === undefined) {
            throw new Error("Invalid key structure");
        }

        if (dataSetId !== this.dataSetToQueryId) {
            throw new Error("numerous dataset ids present in query");
        }
        return dataSetKey;
    }

    private extractInputValue(inputs: any[]): string | number {
        let input: string | number;
        if (inputs.length !== 1) {
            throw new Error("multiple input value for a key");
        }
        input = inputs[0];
        return input;
    }

}
