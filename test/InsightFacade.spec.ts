import {expect} from "chai";

import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import GetGeoLocation from "../src/controller/GetGeoLocation";
import {error} from "util";

// This should match the JSON schema described in test/query.schema.json
// except 'filename' which is injIeected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: string | string[];
    filename: string;  // This is injected when reading the file
}

// describe("InsightFacade Add/Remove Dataset", function () {
//     // Reference any datasets you've added to test/data here and they will
//     // automatically be loaded in the Before All hook.
//     const datasetsToLoad: { [id: string]: string } = {
//         courses: "./test/data/courses.zip",
//         emptyFolder: "./test/data/emptyFolder.zip",
//         emptyZip: "./test/data/emptyZip.zip",
//         zipWithOnlyACatPicInside: "./test/data/zipWithOnlyACatPicInside.zip",
//         specificCourses: "./test/data/specificCourses.zip",
//         invalidJsonFormat: "./test/data/invalidJsonFormat.zip",
//         emptySection: "./test/data/emptySection.zip",
//         rooms: "./test/data/rooms.zip",
//         // more datasets here
//
//         // Leo's dataset
//         coursesNoValidJson: "./test/data/coursesNoValidJson.zip",
//         coursesNoSection: "./test/data/coursesNoSection.zip",
//         courses2: "./test/data/courses2.zip",
//         courses3: "./test/data/courses3.zip",
//         notCourses: "./test/data/notcourses.zip",
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
//                 return {[Object.keys(datasetsToLoad)[i]]: buf.toString("base64")};
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
//     // Test addDataset() & listDatasets()
//     // Basic addDataset(), listDatasets() tests
//     it("Should have no dataset before add, test listDatasets()", async function () {
//         let response: IResponse;
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.body).to.deep.equal([]);
//             expect(response.code).to.equal(200);
//         }
//     });
//
//     it("Should add a valid dataset: courses", async () => {
//         const id: string = "courses";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.body).to.deep.equal([id]);
//             expect(response.code).to.equal(200);
//         }
//     });
//
//     it("Should have a dataset of courses after add, test listDatasets()", async function () {
//         const name: string = "courses";
//         let expectedDataset: InsightDataset = {
//             id: "courses",
//             kind: InsightDatasetKind.Courses,
//             numRows: 64612
//         };
//         let expected: InsightDataset[] = [];
//         expected.push(expectedDataset);
//         let response: IResponse;
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.body).to.deep.equal(expected);
//             expect(response.code).to.equal(200);
//         }
//     });
//
//     it("Should not add a existing dataset", async () => {
//         const id: string = "courses";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should still have only one dataset of courses after add, test listDatasets()", async function () {
//         const name: string = "courses";
//         let expectedDataset: InsightDataset = {
//             id: name,
//             kind: InsightDatasetKind.Courses,
//             numRows: 64612
//         };
//         let expected: InsightDataset[] = [];
//         expected.push(expectedDataset);
//         let response: IResponse;
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(200);
//             expect(response.body).to.deep.equal(expected);
//         }
//     });
//
//     it("Should remove the courses dataset", async () => {
//         const id: string = "courses";
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(id);
//             expect(insightFacade.dataSets.length).to.deep.equal(0);
//         }
//     });
//
//     it("Should have no dataset after remove, test listDatasets()", async function () {
//         let response: IResponse;
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.body).to.deep.equal([]);
//             expect(response.code).to.equal(200);
//         }
//     });
//
//     it("Should add a specific dataset", async () => {
//         const id: string = "specificCourses";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(200);
//             expect(response.body).to.deep.equal([id]);
//         }
//     });
//
//     it("Should have a dataset of specific courses after add, test listDatasets()", async function () {
//         const id: string = "specificCourses";
//         let expectedDataset: InsightDataset = {
//             id: "specificCourses",
//             kind: InsightDatasetKind.Courses,
//             numRows: 61
//         };
//         let expected: InsightDataset[] = [];
//         expected.push(expectedDataset);
//         let response: IResponse;
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(200);
//             expect(response.body).to.deep.equal(expected);
//         }
//     });
//
//     it("Should remove the specific courses dataset", async () => {
//         const id: string = "specificCourses";
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.equal(id);
//         }
//     });
//
//     it("Should have no dataset after delete, test listDatasets()", async function () {
//         let response: IResponse;
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(200);
//             expect(response.body).to.deep.equal([]);
//         }
//     });
//
//     it("Should add a courses dataset", async () => {
//         const id: string = "courses";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//             expect(response.body).to.deep.equal([id]);
//         }
//     });
//
//     it("list 3 datasets", async () => {
//         const id2: string = "courses2";
//         const id3: string = "courses3";
//         let response: IResponse;
//         let expectedResponse: InsightDataset[];
//         expectedResponse = [];
//         expectedResponse[0] = {
//             id: "courses",
//             kind: InsightDatasetKind.Courses,
//             numRows: 64612,
//         };
//
//         expectedResponse[1] = {
//             id: "courses2",
//             kind: InsightDatasetKind.Courses,
//             numRows: 35,
//         };
//
//         expectedResponse[2] = {
//             id: "courses3",
//             kind: InsightDatasetKind.Courses,
//             numRows: 18,
//         };
//
//         try {
//             await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
//             await insightFacade.addDataset(id3, datasets[id3], InsightDatasetKind.Courses);
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.body).to.deep.equal(expectedResponse);
//             expect(response.code).to.equal(200);
//         }
//     });
//
//     it("Should throw error for adding empty zip file", async () => {
//         const id: string = "emptyZip";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for adding empty folder", async () => {
//         const id: string = "emptyFolder";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for adding a zip with only cat picture inside (invalid file type)", async () => {
//         const id: string = "zipWithOnlyACatPicInside";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for adding a zip with invalid Json file format)", async () => {
//         const id: string = "invalidJsonFormat";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for adding a zip of sections/classes without any section)", async () => {
//         const id: string = "emptySection";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for adding an empty Json file)", async () => {
//         const id: string = "emptyJsonFile";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for applying invalid file path)", async () => {
//         const id: string = "invalidPath";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for null file name)", async () => {
//         const id: string = null;
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for undefined file name)", async () => {
//         const id: string = undefined;
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for adding null dataset)", async () => {
//         const id: string = "courses";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for adding undefined dataset)", async () => {
//         const id: string = "courses";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for using undefined file name and adding undefined dataset)", async () => {
//         const id: string = undefined;
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for using null file name and adding null dataset)", async () => {
//         const id: string = null;
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for using null file name and adding undefined dataset)", async () => {
//         const id: string = null;
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for using undefined file name and adding null dataset)", async () => {
//         const id: string = undefined;
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for using undefined file type and adding null type data)", async () => {
//         const id: string = undefined;
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for using undefined file type and adding undefined type data)", async () => {
//         const id: string = undefined;
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     // Test removeDataset() & listDatasets()
//     it("Should remove the existing courses dataset", async () => {
//         const id: string = "courses";
//         let response: string;
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(id);
//         }
//     });
//
//     it("Should have no dataset after removeDataSet()", async function () {
//         let response: IResponse;
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.body).to.deep.equal([]);
//             expect(response.code).to.deep.equal(400);
//         }
//     });
//
//     it("Should throw error for delete non-existing dataset", async () => {
//         const id: string = "specificCourses";
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(NotFoundError);
//         }
//     });
//
//     it("Should throw error for removing dataset with invalid path", async () => {
//         const id: string = "invalidPath";
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(NotFoundError);
//         }
//     });
//
//     it("Should throw error for removing using null file name", async () => {
//         const id: string = null;
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(InsightError);
//         }
//     });
//
//     it("Should throw error for adding wrong kind of dataset", async () => {
//         const id: string = "courses3";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.code).to.equal(400);
//         }
//     });
//
//     it("Should throw error for removing using undefined file name", async () => {
//         const id: string = undefined;
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(InsightError);
//         }
//     });
//
//     it("should added valid dataset 'courses3' to datasets", async () => {
//         const id: string = "courses3";
//         let response: IResponse;
//
//         try {
//             response = await insightFacade.addDataset("courses3", datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.body).to.be.deep.equal([id]);
//             expect(response.code).to.equal(200);
//         }
//     });
//
//     it("should return valid geolocation for a valid address", async () => {
//         let response: any;
//
//         try {
//             let geolocation  = new GetGeoLocation();
//             response = await geolocation.getGeoLocation("6245 Agronomy Road V6T 1Z4");
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.deep.equal([49.26125, -123.24807]);
//         }
//     });
//
//     it("should return error for a invalid address", async () => {
//         let response: any;
//
//         try {
//             let geolocation  = new GetGeoLocation();
//             response = await geolocation.getGeoLocation("6245 Agronomy Roaaaaaaad V6T 1Z4");
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.a.instanceOf(Error);
//         }
//     });
//
//     it("Should add a valid dataset: rooms", async () => {
//         const id: string = "rooms";
//         let response: IResponse;
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response.body).to.deep.equal([id]);
//             expect(response.code).to.equal(200);
//         }
//     });
// });

    // This test suite dynamically generates tests from the JSON files in test/queries.
    // You should not need to modify it; instead, add additional files to the queries directory.

// describe("InsightFacade PerformQuery", () => {
//     const datasetsToQuery: { [id: string]: string } = {
//         courses: "./test/data/courses.zip",
//         rooms: "./test/data/rooms.zip",
//     };
//     let insightFacade: InsightFacade;
//     let testQueries: ITestQuery[] = [];
//     // Create a new instance of InsightFacade, read in the test queries from test/queries and
//     // add the datasets specified in datasetsToQuery.
//     before(async function () {
//         Log.test(`Before: ${this.test.parent.title}`);
//
//         // Load the query JSON files under test/queries.
//         // Fail if there is a problem reading ANY query.
//         try {
//             testQueries = await TestUtil.readTestQueries();
//             expect(testQueries).to.have.length.greaterThan(0);
//         } catch (err) {
//             expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
//         }
//
//         try {
//             insightFacade = new InsightFacade();
//         } catch (err) {
//             Log.error(err);
//         } finally {
//             expect(insightFacade).to.be.instanceOf(InsightFacade);
//         }
//
//         // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
//         // Fail if there is a problem reading ANY dataset.
//         try {
//             const loadDatasetPromises: Array<Promise<Buffer>> = [];
//             for (const [id, path] of Object.entries(datasetsToQuery)) {
//                 loadDatasetPromises.push(TestUtil.readFileAsync(path));
//             }
//             const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
//                 return {[Object.keys(datasetsToQuery)[i]]: buf.toString("base64")};
//             });
//             expect(loadedDatasets).to.have.length.greaterThan(0);
//
//             const responsePromises: Array<Promise<string[]>> = [];
//             const datasets: { [id: string]: string } = Object.assign(
//                 {},
//                 ...loadedDatasets,
//             );
//             // for (const [id, content] of Object.entries(datasets)) {
//             //     responsePromises.push(
//             //         insightFacade.addDataset(id, content, InsightDatasetKind.Courses),
//             //     );
//             // }
//             responsePromises.push(
//                 insightFacade.addDataset("courses", datasets["courses"], InsightDatasetKind.Courses).);
//             responsePromises.push(
//                 insightFacade.addDataset("rooms", datasets["rooms"], InsightDatasetKind.Rooms));
//
//             // This try/catch is a hack to let your dynamic tests execute even if the addDataset method fails.
//             // In D1, you should remove this try/catch to ensure your datasets load successfully before trying
//             // to run you queries.
//             try {
//                 const responses: string[][] = await Promise.all(responsePromises);
//                 responses.forEach((response) => expect(response).to.be.an("array"));
//             } catch (err) {
//                 Log.warn(
//                     `Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`,
//                 );
//             }
//         } catch (err) {
//             expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
//         }
//     });
//
//     beforeEach(function () {
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//     });
//
//     after(function () {
//         Log.test(`After: ${this.test.parent.title}`);
//     });
//
//     afterEach(function () {
//         Log.test(`AfterTest: ${this.currentTest.title}`);
//     });
//
//     // Dynamically create and run a test for each query in testQueries
//     it("Should run test queries", () => {
//         describe("Dynamic InsightFacade PerformQuery tests", () => {
//             for (const test of testQueries) {
//                 it(`[${test.filename}] ${test.title}`, async () => {
//                     let response: any[];
//
//                     try {
//                         response = await insightFacade.performQuery(test.query);
//                     } catch (err) {
//                         response = err;
//                     } finally {
//                         if (test.isQueryValid) {
//                             expect(response).to.deep.equal(test.result);
//                         } else {
//                             expect(response).to.be.instanceOf(InsightError);
//                         }
//                     }
//                 });
//             }
//         });
//     });
// });
