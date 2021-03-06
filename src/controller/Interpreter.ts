import Log from "../Util";
import {INode} from "../model/Node";
import {ICourseSection} from "../model/CourseSection";
import {IDataSet} from "../model/DataSet";
import {InsightError} from "./IInsightFacade";
import {error} from "util";

export default class Interpreter {
    constructor() {
        // Log.trace("Interpreter created");
    }

    public filterCourses(node: INode, dataSetToQuery: IDataSet, columnsToQuery: string[]): any[] {
        let result: any[] = [];
        dataSetToQuery.data.forEach((section) => {
            if (this.filterCoursesHelper(node, section)) {
                result.push(this.createResult(section, columnsToQuery, dataSetToQuery.id));
            }
        });
        return result;

    }

    private filterCoursesHelper(node: INode, section: ICourseSection): boolean {
        switch (node.filterName) {
            case "WHERE":
                return this.executeWHERE(node, section);
            case "GT":
                return this.executeGT(node.key, node.filterValue, section);
            case "LT":
                return this.executeLT(node.key, node.filterValue, section);
            case "EQ":
                return this.executeEQ(node.key, node.filterValue, section);
            case "IS":
                return this.executeIS(node.key, node.filterValue, section);
            case "AND":
                return this.executeAND(node, section);
            case "OR":
                return this.executeOR(node, section);
            case "NOT":
                return this.executeNOT(node, section);
            default:
                throw new Error("WTF, its not suppose to get here");
        }
    }

    private executeGT(key: string, filterValue: number | string, section: ICourseSection): boolean {
        return section[key] > filterValue;
    }

    private executeLT(key: string, filterValue: number | string, section: ICourseSection): boolean {
        return section[key] < filterValue;
    }

    private executeEQ(key: string, filterValue: number | string, section: ICourseSection): boolean {
        return section[key] === filterValue;
    }

    private executeIS(key: string, filterValue: number | string, section: ICourseSection): boolean {
        let s = filterValue.toString();
        let seckey = section[key].toString();
        let bool: boolean;
        bool = false;
        if (s.includes("*")) { // potential wildcards
            if (s === "*" || s === "**") { // return all sets
                return true;
            } else {
                return this.wildComparison(seckey, s, section);
            }
        } else { // no wildcard
            return (section[key] === s);
        }

        // let regExp = new RegExp(filterValue.toString().replace(/\*/g, "."));
        // let test = (regExp.test(section[key].toString().replace(/\s/g, "")));
        // return (regExp.test(section[key].toString().replace(/\s/g, "")));
    }

    private executeWHERE(node: INode, section: ICourseSection): boolean {
        let allTrue: boolean = true;
        for (let childNode of node.childNodes) {
            if (!this.filterCoursesHelper(childNode, section)) {
                allTrue = false;
            }
        }
        return allTrue;
    }

    private executeAND(node: INode, section: ICourseSection): boolean {
        let allTrue: boolean = true;
        for (let childNode of node.childNodes) {
            if (!this.filterCoursesHelper(childNode, section)) {
                allTrue = false;
            }
        }
        return allTrue;
    }

    private executeOR(node: INode, section: ICourseSection): boolean {
        let atLeastOneTrue: boolean = false;
        for (let childNode of node.childNodes) {
            if (this.filterCoursesHelper(childNode, section)) {
                atLeastOneTrue = true;
            }
        }
        return atLeastOneTrue;
    }

    private executeNOT(node: INode, section: ICourseSection): boolean {
        return !(this.filterCoursesHelper(node.childNodes[0], section));
    }

    private createResult(section: ICourseSection, columnsToQuery: string[], dataSetToQueryId: string): any {
        let result: any = {};
        columnsToQuery.forEach((column) => {
            result[column] = section[this.extractKey(column)];
        });

        return result;
    }

    private wildComparison(key: string, filterValue: string, section: ICourseSection): boolean {
        if ((filterValue.substr(1, filterValue.length - 2).includes("*")))  {
            return false;
        }

        if (filterValue.startsWith("*") && !(filterValue.endsWith("*"))) {
            return key.endsWith(filterValue.substr(1, filterValue.length - 1));
        } else if ((filterValue.endsWith("*")) && !(filterValue.startsWith("*"))) {
            return key.startsWith(filterValue.substr(0, filterValue.length - 1));
        } else if ((filterValue.endsWith("*") && (filterValue.startsWith("*") &&
                    !(filterValue.substr(1, filterValue.length - 2).includes("*"))))) {
            return key.includes(filterValue.substr(1, filterValue.length - 2 ));
        } else {
            return false;
        }
     }

    private extractKey(idKey: string): string {
        let dataSetKey: string;
        let keyArrHolder: string[] = idKey.split("_");
        dataSetKey = keyArrHolder[1];

        return dataSetKey;
    }
}
