require("luau-lsp").config {
  sourcemap = {
    enabled = true,
    autogenerate = true,
    generator_cmd = {
      vim.fn.expand("~/.rokit/bin/rojo"),
      "sourcemap",
      "--watch",
      "--include-non-scripts",
      "--output",
      "sourcemap.json",
      "default.project.json",
    },
  },
}
