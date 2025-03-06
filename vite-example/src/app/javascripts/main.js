import { Application } from "@hotwired/stimulus"
import StimulusControllerResolver, {
  createViteGlobResolver,
} from "../../../../src/stimulus-controller-resolver"

const application = Application.start()

StimulusControllerResolver.install(
  application,
  createViteGlobResolver(
    {
      glob: import.meta.glob("./**/*_controller.js"),
      regex: /^(?:.*?(?:controllers)\/|\.?\.\/)?(.+?)(?:[_-]controller\..+?)$/,
    },
    {
      glob: import.meta.glob(
        "../../../components/*/app/javascript/controllers/**/*_controller.js",
      ),
      regex: /^(?:.*?(?:controllers)\/|\.?\.\/)?(.+?)(?:[_-]controller\..+?)$/,
    },
  ),
)
