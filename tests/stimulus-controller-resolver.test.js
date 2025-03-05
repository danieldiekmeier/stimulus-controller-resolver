import { describe, it } from "node:test"
import {
  createViteGlobResolver,
  identifierForGlobKey,
} from "../src/stimulus-controller-resolver.js"
import assert from "node:assert"

function stub(v) {
  return async () => {
    return { default: v }
  }
}

describe("createViteGlobResolver", () => {
  it("maps paths to controllers", async () => {
    const resolverFn = createViteGlobResolver({
      "./a_controller.js": stub("a"),
    })

    assert.equal(await resolverFn("a"), "a")
  })

  it("overrides with later resolvers", async () => {
    const resolverFn = createViteGlobResolver(
      {
        "./a_controller.js": stub("a"),
        "./b_controller.js": stub("b"),
      },
      {
        "./b_controller.js": stub("override b"),
      },
    )

    assert.equal(await resolverFn("a"), "a")
    assert.equal(await resolverFn("b"), "override b")
  })

  it("can take options as last argument", async () => {
    const resolverFn = createViteGlobResolver(
      {
        glob: { "./a_controller.js": stub("a") },
      },
      {
        glob: { "./b_controller.js": stub("b") },
      },
    )

    assert.equal(await resolverFn("a"), "a")
    assert.equal(await resolverFn("b"), "b")
  })

  it("accepts a custom regex", async () => {
    const resolverFn = createViteGlobResolver({
      glob: {
        "../../../components/blogs/app/javascript/sprinkles/blogs/previous_updates_controller.js":
          stub("prev"),
      },
      regex: /^.+sprinkles\/(.+?)_controller.js$/,
    })

    assert.equal(await resolverFn("blogs--previous-updates"), "prev")
  })

  it("accepts a custom toIdentifier function", async () => {
    const resolverFn = createViteGlobResolver({
      glob: {
        "../cards/album/stimulus_controller.js": stub("AlbumCard"),
      },
      toIdentifier(key) {
        return key.split("cards/")[1].split("/stimulus_controller")[0] + "-card"
      },
    })

    assert.equal(await resolverFn("album-card"), "AlbumCard")
  })

  it("can mix and match", async () => {
    const resolverFn = createViteGlobResolver(
      {
        "./a_controller.js": stub("a"),
      },
      {
        glob: { "./b_controller.js": stub("b") },
        regex: /\/(.+?)_controller.js$/,
      },
      {
        glob: { "./c_controller.js": stub("c") },
        toIdentifier: (key) => "c",
      },
    )

    assert.equal(await resolverFn("a"), "a")
    assert.equal(await resolverFn("b"), "b")
    assert.equal(await resolverFn("c"), "c")
  })
})

describe("identifierForGlobKey", () => {
  it("transforms a path to the controller identifier", () => {
    const mapping = {
      "./a_controller.js": "a",
      "./b_controller.ts": "b",
      "../app/javascript/controllers/blogs/previous_updates_controller.js":
        "blogs--previous-updates",
    }

    Object.entries(mapping).forEach(([path, correct]) => {
      assert.equal(identifierForGlobKey(path), correct)
    })
  })
})
