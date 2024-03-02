/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { customInputs } from "../__mocks__/customInputs.js"
import mockStore from "../__mocks__/store"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import router from "../app/Router.js"

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // set up the mock localStorage and mock user for the test
    Object.defineProperty(window, "localStorage", { value: localStorageMock })

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    )
  })

  describe("When I am on NewBill Page", () => {
    test("then mail icon in vertical layout should be highlighted", async () => {
      // creation of the root element
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)

      // load to the new bill page using the router
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      // wait for the mail icon to be displayed and check that it is active
      await waitFor(() => screen.getByTestId("icon-mail"))
      const mailIcon = screen.getByTestId("icon-mail")

      expect(mailIcon.classList).toContain("active-icon")
    })
  })

  describe("When I fill the form ", () => {
    let newBill

    beforeEach(() => {
      // set up the new bill
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
    })

    describe("When I upload a file", () => {
      let handleChangeFile

      beforeEach(() => {
        // create the handleChangeFile mocked function
        handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      })

      test("then handleChangeFile should be triggered ", async () => {
        // get the input file element and add the event listener
        await waitFor(() => screen.getByTestId("file"))
        const inputFile = screen.getByTestId("file")

        inputFile.addEventListener("change", handleChangeFile)

        // creation of the test file to upload
        const testFile = new File(["test"], "test.jpg", { type: "image/jpg" })

        // simulate the file upload
        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        })

        // check that the file name is displayed
        expect(screen.getByTestId("file").files[0].name).toBe("test.jpg")

        // caheck that handleChangeFile is called
        expect(handleChangeFile).toHaveBeenCalled()

        // check formdata values
        expect(inputFile.files[0]).toEqual(testFile)
      })

      test("then upload a wrong file should trigger an error", async () => {
        // get the input file element and add the event listener
        await waitFor(() => screen.getByTestId("file"))
        const inputFile = screen.getByTestId("file")

        inputFile.addEventListener("change", handleChangeFile)

        // creation of the test file to upload
        const testFile = new File(["test"], "test.pdf", {
          type: "document/pdf",
        })

        // spy the console
        const errorSpy = jest.spyOn(console, "error")

        // simulate the file upload
        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        })

        // check that the error message is displayed in the console
        expect(errorSpy).toHaveBeenCalledWith("wrong extension")
      })
    })

    // POST integration test

    describe("When I click on the submit button", () => {
      test("then it should create a new bill", () => {
        // fill the form inputs with the custom values
        customInputs.forEach((input) =>
          fireEvent.change(screen.getByTestId(input.testId), {
            target: { value: input.value },
          })
        )

        // spy the onNavigate and updateBill method
        const spyOnNavigate = jest.spyOn(newBill, "onNavigate")

        const spyUpdateBill = jest.spyOn(newBill, "updateBill")

        // mock the handleSubmit function
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)

        // submit the form
        fireEvent.submit(form)

        // check that the handleSubmit function was called
        expect(handleSubmit).toHaveBeenCalled()

        // check that the updateBill method was called with the right values
        expect(spyUpdateBill).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "Transports",
            name: "Vol Paris-Bordeaux",
            date: "2023-04-01",
            amount: 42,
            vat: "18",
            pct: 20,
            commentary: "test bill",
            status: "pending",
          })
        )

        // check that the onNavigate method was called with the right path
        expect(spyOnNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])

        // check that the page has changed to the bill page
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      })
    })
  })
})
