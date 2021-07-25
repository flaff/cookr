import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Row,
  Col,
  Form,
  Switch,
  Input,
  Space,
  Popover,
  Tooltip,
  Divider,
  message,
} from "antd";
import Icon from "@ant-design/icons";
import copy from "copy-to-clipboard";
import Fuse from "fuse.js";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import { debounce } from "lodash";
import TextArea from "antd/lib/input/TextArea";
import {
  SortAlphaDown,
  Funnel,
  ListNested,
  SortDownAlt,
  Clipboard,
  Stars,
} from "react-bootstrap-icons";
import { FatSlider } from "./FatSlider";
import { StyledButton } from "./StyledButton";
import { ContainerSeparator, RoundContainer, RoundSpacer } from "./containers";
import { green } from "@ant-design/colors";

function toTodo(text) {
  return `- [ ]  ${text}`;
}

function removeUnitsInParenthesis(text) {
  return text.replace(/\([^)]*\)/g, "");
}

function splitItems(text) {
  return text.replace(/(\([^)]*\)) ([A-Z])/g, "$1\n$2");
}

function removeTrailingCommas(text) {
  return text.replaceAll(', ', '').replaceAll(',');
}

function removeStars(text) {
  return text.replaceAll('*', '');
}

function cleanUpText(text) {
  return removeStars(removeTrailingCommas(removeUnitsInParenthesis(splitItems(text))));
}

function mergeProducts(productA, productB) {
  return {
    name: productA.name,
    amount: Number(productA.amount) + Number(productB.amount),
    mergeInfo:
      (productA.mergeInfo ||
        `\n    - [ ] ${productA.name} ${productA.amount} g`) +
      (productB.mergeInfo ||
        `\n    - [ ] ${productB.name} ${productB.amount} g`),
  };
}

function reduceSameProducts({ score, fuzzyMatchEnabled }) {
  if (!fuzzyMatchEnabled) {
    return function (products, product) {
      // TODO: strict merging
      return [...products, product];
    };
  }

  return function (products, product) {
    const fuse = new Fuse(products, { includeScore: true, keys: ["name"] });
    const [result] = fuse
      .search(product.name)
      .sort((a, b) => (a.score > b.score ? 1 : -1));

    if (result && result.score < score) {
      return [
        ...products.filter((_, index) => index !== result.refIndex),
        mergeProducts(product, result.item),
      ];
    }

    return [...products, product];
  };
}

function textToProduct(productText) {
  const amount = /(?<amount>\d+)[ ]?g/g.exec(productText)?.groups?.amount || "";
  return {
    name: productText
      .replace(`${amount}g`, "")
      .replace("*", "")
      .replace(`${amount} g`, "")
      .replaceAll(" , ", "")
      .replaceAll("  ", "")
      .trim(),
    amount: amount,
  };
}

function productToText({ showMergeInfo }) {
  return function (product) {
    return [
      showMergeInfo ? `**${product.name}**` : product.name,
      `\`${product.amount} g\``,
      `[🔗](https://duckduckgo.com/?q=${product.name.replaceAll(
        " ",
        "+"
      )}&atb=v272-1&iax=images&ia=images)`,
      showMergeInfo && product.mergeInfo,
    ]
      .filter(Boolean)
      .join(" ");
  };
}

export function LinesToMd() {
  const [showMergeInfo, setShowMergeInfo] = useState(true);
  const [fuzzyMatchEnabled, setFuzzyMatchEnabled] = useState(true);
  const [sourceText, setSourceText] = useState("");
  const [score, setScore] = useState(20);

  const [markdownText, setMarkdownText] = useState("");

  const updateMarkdownText = useMemo(
    () =>
      debounce((text, { score, showMergeInfo, fuzzyMatchEnabled }) => {
        const items = text
          .split("\n")
          .filter(Boolean)
          .map(removeUnitsInParenthesis)
          .map(textToProduct)
          .reduce(
            reduceSameProducts({ score: score / 100, fuzzyMatchEnabled }),
            []
          )
          .sort((productA, productB) =>
            productA.name > productB.name ? 1 : -1
          )
          .map(productToText({ showMergeInfo }));

        const nextMarkdownText = items.map(toTodo).join("\n");
        setMarkdownText(nextMarkdownText);
      }, 500),
    []
  );

  useEffect(() => {
    updateMarkdownText(sourceText, { score, fuzzyMatchEnabled, showMergeInfo });
  }, [score, showMergeInfo, sourceText, updateMarkdownText]);

  return (
    <>
      <Row gutter={10} style={{ margin: "10px" }}>
        <Col flex={1}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <RoundSpacer>
              <StyledButton
                icon={<Icon component={Stars} />}
                onClick={() => setSourceText((t) => cleanUpText(t))}
                size="large"
              >
                Clean up
              </StyledButton>
              <StyledButton
                icon={<Icon component={SortAlphaDown} />}
                size="large"
                onClick={() =>
                  setSourceText((t) => t.split("\n").sort().join("\n"))
                }
              >
                Sort
              </StyledButton>
            </RoundSpacer>
            <Input.TextArea
              style={{ borderRadius: "10px", minHeight: "80vh" }}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={20}
            />
          </Space>
        </Col>
        <Col flex="50%">
          <div
            style={{ display: "flex", flexDirection: "column", height: "90vh" }}
          >
            <Space direction="vertical">
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <Space>
                  <RoundSpacer>
                    <Tooltip title="Filter">
                      <StyledButton
                        size="large"
                        icon={<Icon component={Funnel} />}
                        style={{ borderRadius: "10px" }}
                      />
                    </Tooltip>
                  </RoundSpacer>
                  <RoundSpacer>
                    <Tooltip title="Merge similar results">
                      <StyledButton
                        size="large"
                        icon={<Icon component={SortDownAlt} />}
                        type={fuzzyMatchEnabled ? "primary" : "secondary"}
                        onClick={() => setFuzzyMatchEnabled((i) => !i)}
                      />
                    </Tooltip>
                    <FatSlider
                      value={fuzzyMatchEnabled ? score : 0}
                      onChange={(value) => setScore(value)}
                      min={0}
                      max={100}
                      step={5}
                      disabled={!fuzzyMatchEnabled}
                    />
                    <ContainerSeparator />
                    <Tooltip title="Show subitems">
                      <StyledButton
                        size="large"
                        icon={<Icon component={ListNested} />}
                        disabled={!fuzzyMatchEnabled}
                        type={
                          fuzzyMatchEnabled && showMergeInfo
                            ? "primary"
                            : "secondary"
                        }
                        onClick={() => setShowMergeInfo((i) => !i)}
                      />
                    </Tooltip>
                  </RoundSpacer>
                </Space>
                <RoundContainer>
                  <Tooltip title="Copy Markdown">
                    <StyledButton
                      size="large"
                      icon={<Icon component={Clipboard} />}
                      style={{
                        background: green.primary,
                        color: "white",
                        borderColor: green.primary,
                      }}
                      disabled={!markdownText}
                      onClick={() => {
                        copy(markdownText, { format: "text/plain" });
                        message.success("Copied to clipboard");
                      }}
                    >
                      Copy
                    </StyledButton>
                  </Tooltip>
                </RoundContainer>
              </Space>
              <RoundContainer
                style={{ flex: "1 1 auto", overflowY: "auto", height: "80vh" }}
              >
                <ReactMarkdown plugins={[gfm]}>{markdownText}</ReactMarkdown>
              </RoundContainer>
            </Space>
          </div>
        </Col>
      </Row>
    </>
  );
}
