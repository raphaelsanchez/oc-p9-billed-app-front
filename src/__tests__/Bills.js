/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom/"
import { screen, waitFor } from "@testing-library/dom"
import Bills from "../containers/Bills"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"

import router from "../app/Router.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId("icon-window"))
      const windowIcon = screen.getByTestId("icon-window")
      //to-do write expect expression
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then should call onNavigate with new bill path", () => {
      const onNavigate = jest.fn()
      const bills = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      })

      bills.handleClickNewBill()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"])
    })
  })
  describe("When I am on Bills page and back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      document.body.innerHTML = BillsUI({ error: "some error message" })
      expect(screen.getAllByText("Erreur")).toBeTruthy()
    })
  })
  describe("When I click on the eye icon", () => {
    test("Then should modify modal content and display it", () => {
      document.body.innerHTML = `
        <div id="modaleFile" class="modal fade" tabindex="-1" role="dialog">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-body"></div>
            </div>
          </div>
        </div>
        <div data-testid="icon-eye" data-bill-url="url-to-bill"></div>
      `
      const onNavigate = jest.fn()
      const bills = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      })
      $.fn.modal = jest.fn() // Mock jQuery's modal function

      bills.handleClickIconEye(screen.getByTestId("icon-eye"))

      expect($(".modal-body").html()).toContain("url-to-bill")
      expect($.fn.modal).toHaveBeenCalledWith("show")
    })
  })
})
