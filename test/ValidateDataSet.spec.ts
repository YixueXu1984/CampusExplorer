import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {expect} from "chai";
import {InsightDataset, InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";

// describe("AddDataSet", () => {
//     const datasetsToLoad: { [id: string]: string } = {
//         coursesMissingFields: "./test/data/coursesMissingFields.zip",
//         coursesMissingFields2: "./test/data/coursesMissingFields2.zip",
//         roomMissingFields: "./test/data/roomMissingFields.zip",
//     };
//
//     let insightFacade: InsightFacade;
//     let datasets: { [id: string]: string };
//
//     before(async function () {
//         Log.test(`Before: ${this.test.parent.title}`);
//
//         try {
//             const loadDatasetPromises: Array<Promise<Buffer>> = [];
//             for (const [id, path] of Object.entries(datasetsToLoad)) {
//                 loadDatasetPromises.push(TestUtil.readFileAsync(path));
//             }
//             const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
//                 return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
//             });
//             datasets = Object.assign({}, ...loadedDatasets);
//             expect(Object.keys(datasets)).to.have.length.greaterThan(0);
//         } catch (err) {
//             expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
//         }
//
//         try {
//             insightFacade = new InsightFacade();
//         } catch (err) {
//             Log.error(err);
//         } finally {
//             expect(insightFacade).to.be.instanceOf(InsightFacade);
//         }
//     });
//
//     beforeEach(function () {
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//     });
//
//     after(function () {
//         Log.test(`After: ${this.test.parent.title}`);
//         // reset datasets in memory & cache
//         let fs = require("fs-extra");
//         fs.removeSync("data/");
//     });
//
//     afterEach(function () {
//         Log.test(`AfterTest: ${this.currentTest.title}`);
//     });
//
//     it("skip the sections if missing required field: Title, id, Professor, Audit, Year, Course, Pass", async () => {
//         const id: string = "coursesMissingFields";
//         let response: string[];
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(InsightError);
//         }
//     });
//
//     it("skip the sections if missing required field: Fail, Subject, Avg", async () => {
//         const id: string = "coursesMissingFields2";
//         let response: string[];
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(InsightError);
//         }
//     });
//
//     it("force check validateSet room", async () => {
//         const id: string = "roomMissingFields";
//         let response: string[];
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(InsightError);
//         }
//     });
// });
