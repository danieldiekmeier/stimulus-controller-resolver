import { Controller } from "@hotwired/stimulus"

export default class PreviousUpdatesController extends Controller {
  static targets = []

  connect() {
    this.element.innerHTML = "Blogs → Previous Updates Controller: ✅"
  }
}
