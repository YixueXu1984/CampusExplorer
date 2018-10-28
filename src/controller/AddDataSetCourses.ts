import {InsightDatasetKind} from "./IInsightFacade";
import Log from "../Util";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import {IDataSet} from "../model/DataSet";
import * as fs from "fs";
import {ICourseSection} from "../model/CourseSection";
import {IDataSetCourseSections} from "../model/DataSetCourseSections";
export default class AddDataSetCourses {

    constructor() {
        Log.trace("Add Data Set");
    }

    private readEachJsonFile(course: JSZipObject): Promise<ICourseSection[]> {
        return new Promise((resolve, reject) => {
            course.async("text")
                .then((sections) => {
                    return this.parseJson(sections);
                })
                .then((courseModel) => {
                    resolve(courseModel);
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

    private parseJson(sections: string): ICourseSection[] {

        let sectionsHolder: { result: any[] };
        sectionsHolder = {
            result: []
        };
        try {
            sectionsHolder = JSON.parse(sections);
        } catch (err) {
            // Log.error(err); //skip sections with invalid jsons
        }
        let courseSections: ICourseSection[] = [];
        for (let section of sectionsHolder.result) {
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
                if (section.Section === "overall") {
                 mSection.year = 1900;
                } else {
                    mSection.year = Number(section.Year);
                }
                mSection.id = String(section.Course);
                mSection.pass = Number(section.Pass);
                mSection.fail = Number(section.Fail);
                mSection.dept = String(section.Subject);
                mSection.avg = Number(section.Avg);
            } else {
                continue; // if missing required fields we skip this section
            }
            courseSections.push(mSection);
        }
        return courseSections;
    }

    private iterateThroughFiles(courses: JSZip, id: string, kind: InsightDatasetKind): Promise<IDataSet> {
        // TODO: add case for Room
        return new Promise((resolve, reject) => {
            let promisearr: Array<Promise<ICourseSection[]>> = [];
            let dataSet: IDataSetCourseSections = {
                id: "",
                numRows: 0,
                kind: InsightDatasetKind.Courses,
                data: []
            };
            courses.folder("courses").forEach((relativePath, course) => {
                promisearr.push(this.readEachJsonFile(course));
            });

            Promise.all(promisearr)
                .then((courseSections) => {
                    let numRows: number = 0;
                    for (let courseSection of courseSections) {
                        if (courseSection.length > 0) {
                            numRows = numRows + courseSection.length;
                            dataSet.data = dataSet.data.concat(courseSection);
                            // Only add a course if it has at least one section in it
                        }
                    }
                    if (dataSet.data.length === 0) { // This dataSet has no courses in it, or no valid sections
                        throw new Error("Invalid dataset, no valid sections");
                    } else {
                        dataSet.id = id;
                        dataSet.kind = kind;
                        dataSet.numRows = numRows;
                        resolve(dataSet);
                    }
                })
                .catch((err) => {
                    reject(err);
                });

        });
    }

    private cacheDataSet(dataSet: IDataSet): Promise<IDataSet> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync("data/")) {
                fs.mkdirSync("data/");
            }
            fs.writeFile("data/" + dataSet.id + ".json", JSON.stringify(dataSet), (err) => {
                if (err) {
                   return reject(err);
                }
                return resolve(dataSet);

            });
        });

    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<IDataSet> {
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
                .then((courses) => {
                    return this.iterateThroughFiles(courses, id, kind);
                })
                .then((dataSet) => {
                    // cache dataSet here
                    return this.cacheDataSet(dataSet);
                })
                .then((dataSet) => {
                    resolve(dataSet);
                })
                .catch((err) => {
                    reject(err);
                });
        });

    }
}
