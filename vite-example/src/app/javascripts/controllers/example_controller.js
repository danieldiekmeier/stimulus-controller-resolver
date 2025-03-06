import { Controller } from "@hotwired/stimulus"

export default class ExampleController extends Controller {
  static targets = []

  connect() {
    this.element.innerHTML = "Example Controller: ✅"
  }
}
