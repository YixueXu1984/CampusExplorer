import {InsightDatasetKind} from "./IInsightFacade";
import Log from "../Util";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";

export default class AddDataSet {

    constructor() {
        Log.trace("Add Data Set");
    }

    private readEachJsonFile(file: JSZipObject): Promise<string> {
        return new Promise((resolve, reject) => {
            file.async("text")
                .then((json) => {
                    return this.parseJson(json);
                })
                .then((course) => {
                    Log.trace("comeback tmrw");
                })
                .catch((err) => {
                   reject(err);
                });
        });
    }

    private checkValidSection(section: any): boolean {
        // true if section has all the required information, false otherwise
        if (section.Title === null || section.Title === undefined) {
            return false;
        } else if (section.id === null || section.id === undefined) {
            return false;
        } else if (section.Professor === null || section.Professor === undefined) {
            return false;
        } else if (section.Audit === null || section.Audit === undefined) {
            return false;
        } else if (section.Year === null || section.Year === undefined) {
            return false;
        } else if (section.Course === null || section.Course === undefined) {
            return false;
        } else if (section.Pass === null || section.Pass === undefined) {
            return false;
        } else if (section.Fail === null || section.Fail === undefined) {
            return false;
        } else if (section.Subject === null || section.Subject === undefined) {
            return false;
        } else if (section.Avg === null || section.Avg === undefined) {
            return false;
        } else {
            return true;
        }
    }

    private parseJson(json: string): Promise<ICourse> {
        return new Promise((resolve, reject) => {
            let courseHolder = JSON.parse(json);
            let course: ICourse = {
                sections: []
            };
            for (let section of courseHolder.result) {
                let mSection: ICourseSection = {
                    title: "",
                    uuid: "",
                    instructor: "",
                    audit: 0,
                    year: 0,
                    id: "",
                    pass: 0,
                    fail: 0,
                    dept: "",
                    avg: 0
                };
                if (this.checkValidSection(section)) {
                    mSection.title = String(section.Title);
                    mSection.uuid = String(section.id);
                    mSection.instructor = String(section.Professor);
                    mSection.audit = Number(section.Audit);
                    mSection.year = Number(section.Year);
                    mSection.id = String(section.Course);
                    mSection.pass = Number(section.Pass);
                    mSection.fail = Number(section.Fail);
                    mSection.dept = String(section.Subject);
                    mSection.avg = Number(section.Avg);
                } else {
                    continue; // if missing required fields we skip it
                }
                course.sections.push(mSection);
            }
            resolve(course);
        });
    }

    private iterateThroughFiles(result: JSZip): Promise<string[]> {
        return new Promise((resolve, reject) => {
            let successParsing: boolean = true;
            let promisearr: Array<Promise<string>> = [];
            result.forEach((relativePath, file) => {
                promisearr.push(this.readEachJsonFile(file));
            });

            Promise.all(promisearr)
                .then((success) => {
                    resolve(success);
                })
                .catch((err) => {
                    reject(err);
                });

        });
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string> {
        return new Promise((resolve, reject) => {
            if (id === null || id === undefined) {
                reject("invalid id");
            } else if (content === null || content === undefined) {
                reject("invalid content");
            } else if (kind !== InsightDatasetKind.Courses) {
                reject("invalid kind");
            }

            let zip = new JSZip();
            zip.loadAsync(content, {base64: true})
                .then((result) => {
                    return this.iterateThroughFiles(result);
                })
                .then((parsingSuccess) => {
                    return Promise.resolve(parsingSuccess);
                })
                .catch(function (err) {
                    return Promise.reject(err);
                });
        });

    }
}
