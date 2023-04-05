import _ from "lodash";
import encoding from "text-encoding";

figma.showUI(__html__, { width: 400, height: 350 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "copy-to-clipboard") {
    const code = msg.code;
    const currentPage = figma.currentPage;
    const selection = currentPage.selection;
    const vectors = selection.filter(
      (obj) => obj.type === "VECTOR"
    ) as VectorNode[];

    const codes = [];
    for (const vector of vectors) {
      const name = vector.name;
      const bytes = await vector.exportAsync({ format: "SVG" });
      const svg = new encoding.TextDecoder().decode(bytes);

      const viewBox = _.get(svg.match(/viewBox="(.*?)"/), [1]) || "";
      let content = svg
        .replace(/<svg .+>/g, "")
        .replace(/<\/svg>/g, "")
        .trim()
        .replace(/^(.+\n.+)$/, "<>\n$1\n</>")
        .replace(/clip-rule="/g, 'clipRule="')
        .replace(/fill-rule="/g, 'fillRule="')
        .replace(/fill=".+"/g, 'fill="currentColor"');
      const parsedCode = code
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{viewBox\}\}/g, viewBox)
        .replace(/\{\{content\}\}/g, content);

      codes.push(parsedCode);
    }
    const result = codes.join(",\n");

    figma.ui.postMessage({
      type: "result",
      result,
    });
    return;
  }

  figma.closePlugin();
};
