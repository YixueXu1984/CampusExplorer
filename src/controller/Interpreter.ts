import Log from "../Util";
import {INode} from "../model/Node";
import {ICourseSection} from "../model/CourseSection";
import {IDataSet} from "../model/DataSet";
import {error, isBoolean} from "util";
import {InsightError} from "./IInsightFacade";

export default class Interpreter {
    constructor() {
        // Log.trace("Interpreter created");
    }

    public filterCourses(node: INode, dataSetToQuery: IDataSet, columnsToQuery: string[]): any[] {
        let result: any[] = [];
        dataSetToQuery.courses.forEach((section) => {
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
        if (s.includes("*")) {
            bool = this.wildComparison(seckey, s, section);
        }
        return (section[key] === s) || bool;
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
            result[dataSetToQueryId + "_" + column] = section[column];
        });

        return result;
    }

    private wildComparison(key: string, filterValue: string, section: ICourseSection): boolean {
        if (filterValue.substr(0, 1) === "*"
            && !(filterValue.substr(filterValue.length - 1, 1 ) === "*")) {
            return key.includes(filterValue.substr(1, filterValue.length ));
        } else if (filterValue.substr(filterValue.length - 1 , 1) === "*"
            && !(filterValue.substr(0, 1) === "*"))  {
            return key.includes(filterValue.substr(0, filterValue.length - 1));
        } else if (filterValue.substr(filterValue.length - 1 , 1) === "*"
            && (filterValue.substr(0, 1) === "*")
        && !(filterValue.substr(1, filterValue.length - 2).includes("*"))) {
            return key.includes(filterValue.substr(1, filterValue.length - 2 ));
            // key.includes(filterValue.substr(1, filterValue.length - 1));
        } else if (filterValue.substr(1, filterValue.length - 1).includes("*")) {
            throw error(new InsightError("wrong placement of wildcard.")); }
        // let bool: boolean;
        // let array = Array();
        // let startIndex = 0;
        // array = key.split("*");
        // let i: number;
        // bool = true;
        // for (i = 0 , i < array.length; i++;) {
        //     let index = filterValue.indexOf(array[i], startIndex);
        //     if (index === -1) {
        //         bool = false;
        //         break;
        //     } else { startIndex = index; }
        // }
        // return bool;
    }
}
