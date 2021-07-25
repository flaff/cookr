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
import { debounce, uniq } from "lodash";
import TextArea from "antd/lib/input/TextArea";
import {
  SortAlphaDown,
  Funnel,
  ListNested,
  SortDownAlt,
  Clipboard,
  Stars,
  Bucket,
} from "react-bootstrap-icons";
import { FatSlider } from "./FatSlider";
import { StyledButton } from "./StyledButton";
import { ContainerSeparator, RoundContainer, RoundSpacer } from "./containers";
import { green } from "@ant-design/colors";
import { IngredientCategoryMatchingRule } from "../contentful/ingredientCategoryMatchingRule";
import { ViewMatchRulesButton } from "./ViewMatchRulesButton";

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
  return text.replaceAll(", ", "").replaceAll(",");
}

function removeStars(text) {
  return text.replaceAll("*", "");
}

function cleanUpText(text) {
  return removeStars(
    removeTrailingCommas(removeUnitsInParenthesis(splitItems(text)))
  );
}

export interface Product {
  name: string;
  amount: number;
  merged?: Product[];
  match?: string;
  matchCategory?: string;
  matchScore?: number;
}

function mergeProducts(productA: Product, productB: Product): Product {
  return {
    name: productA.name,
    amount: Number(productA.amount) + Number(productB.amount),
    merged: uniq([
      ...(productA.merged || []),
      ...(productB.merged || []),
      productA,
      productB,
    ]),
  };
}

function reduceSameProducts({
  score,
  mergeSimilar,
}: {
  score: number;
  mergeSimilar: boolean;
}) {
  if (!mergeSimilar) {
    return function (products, product) {
      // TODO: strict merging
      return [...products, product];
    };
  }

  return function (products: Product[], product: Product) {
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

function textToProduct(productText: string): Product {
  const amount = /(?<amount>\d+)[ ]?g/g.exec(productText)?.groups?.amount || "";
  return {
    name: productText
      .replace(`${amount}g`, "")
      .replace(`${amount} g`, "")
      .replaceAll(" , ", "")
      .replaceAll("  ", "")
      .trim(),
    amount: +amount,
  };
}

function productToText({ showMerged }): (product: Product) => string {
  return function (product: Product): string {
    return [
      showMerged ? `**${product.name}**` : product.name,
      `\`${product.amount} g\``,
      `[🔗](https://duckduckgo.com/?q=${product.name.replaceAll(
        " ",
        "+"
      )}&atb=v272-1&iax=images&ia=images)`,
      showMerged &&
        product.merged
          ?.map((product) => `\n    - [ ] ${product.name} ${product.amount} g`)
          .join(""),
    ]
      .filter(Boolean)
      .join(" ");
  };
}

interface LinesToMdProps {
  matchingRules: IngredientCategoryMatchingRule[];
}

export function LinesToMd({ matchingRules }: LinesToMdProps) {
  const [showMerged, setShowMerged] = useState(true);
  const [mergeSimilar, setMergeSimilar] = useState(true);
  const [categorise, setCategorise] = useState(true);
  const [sourceText, setSourceText] = useState("");
  const [mergeMaxScore, setMergeMaxScore] = useState(20);
  const [categoriseMaxScore, setCategoriseMaxScore] = useState(80);
  const [categorisedProducts, setCategorisedProducts] = useState<{
    [category: string]: Product[];
  }>({});

  const [markdownText, setMarkdownText] = useState("");

  const matchingRulesFuse = useMemo(
    () =>
      new Fuse(matchingRules, {
        includeScore: true,
        keys: ["contains"],
        isCaseSensitive: false,
        useExtendedSearch: true,
      }),
    [matchingRules]
  );

  const matchingRuleRegexes = useMemo(
    () =>
      matchingRules.map((matchingRule) => ({
        ...matchingRule,
        contains: new RegExp(matchingRule.contains, "i"),
      })),
    [matchingRules]
  );

  const updateMarkdownText = useMemo(
    () =>
      debounce(
        (
          text: string,
          {
            matchingRules,
            mergeMaxScore,
            categoriseMaxScore,
            showMerged,
            mergeSimilar,
            matchingRulesFuse,
            categorise,
            matchingRuleRegexes,
          }: {
            matchingRules: IngredientCategoryMatchingRule[];
            mergeMaxScore: number;
            mergeSimilar: boolean;
            showMerged: boolean;
            categoriseMaxScore: number;
            categorise: boolean;
            matchingRulesFuse: any;
            matchingRuleRegexes: any;
          }
        ) => {
          const products = text
            .split("\n")
            .filter(Boolean)
            .map(removeUnitsInParenthesis)
            .map(textToProduct)
            .reduce(
              reduceSameProducts({
                score: mergeMaxScore / 100,
                mergeSimilar,
              }),
              []
            )
            .sort((productA, productB) =>
              productA.name > productB.name ? 1 : -1
            );

          if (categorise) {
            const categorisedProducts = {};

            for (const product of products) {
              const [fuzzyResult] = matchingRulesFuse
                .search(product.name)
                .sort((a, b) => (a.score > b.score ? 1 : -1))
                .filter((result) => result.score <= categoriseMaxScore / 100);

              const regexResult =
                !fuzzyResult &&
                matchingRuleRegexes.find((matchingRule) =>
                  matchingRule.contains.test(product.name)
                );

              const result =
                fuzzyResult ||
                (regexResult && {
                  score: -1,
                  item: regexResult,
                });

              const categoryName = result
                ? result.item.category.name
                : "Nieznane";

              categorisedProducts[categoryName] = [
                ...(categorisedProducts[categoryName] || []),
                {
                  ...product,
                  match: matchingRules.find(
                    (rule) => rule.category.name === categoryName
                  )?.contains,
                  matchCategory: categoryName,
                  matchScore: result?.score,
                },
              ];

              setCategorisedProducts(categorisedProducts);

              let nextMarkdownText = "";

              const sortedCategoryNames = Object.keys(categorisedProducts).sort(
                (categoryNameA, categoryNameB) =>
                  (categoryNameA === "Nieznane" && -1) ||
                  (categoryNameA > categoryNameB ? 1 : -1)
              );

              for (const categoryName of sortedCategoryNames) {
                const products = categorisedProducts[categoryName];
                if (categoryName !== "Nieznane") {
                  nextMarkdownText += `\n## ${categoryName}\n`;
                } else {
                  nextMarkdownText += `\n`;
                }
                nextMarkdownText += products
                  .map(productToText({ showMerged }))
                  .map(toTodo)
                  .join("\n");
              }

              setMarkdownText(nextMarkdownText);
            }
          } else {
            const nextMarkdownText = products
              .map(productToText({ showMerged }))
              .map(toTodo)
              .join("\n");
            setMarkdownText(nextMarkdownText);
          }
        },
        500
      ),
    [matchingRulesFuse, matchingRules]
  );

  useEffect(() => {
    updateMarkdownText(sourceText, {
      mergeMaxScore,
      mergeSimilar,
      categoriseMaxScore,
      categorise,
      showMerged,
      matchingRulesFuse,
      matchingRules,
      matchingRuleRegexes,
    });
  }, [
    sourceText,
    mergeMaxScore,
    mergeSimilar,
    categoriseMaxScore,
    categorise,
    showMerged,
    matchingRulesFuse,
    matchingRules,
    matchingRuleRegexes,
  ]);

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
                    <Tooltip title="Merge similar results">
                      <StyledButton
                        size="large"
                        icon={<Icon component={SortDownAlt} />}
                        type={mergeSimilar ? "primary" : "secondary"}
                        onClick={() => setMergeSimilar((i) => !i)}
                      />
                    </Tooltip>
                    <FatSlider
                      value={mergeSimilar ? mergeMaxScore : 0}
                      onChange={(value) => setMergeMaxScore(value)}
                      min={0}
                      max={100}
                      step={5}
                      disabled={!mergeSimilar}
                    />
                    <ContainerSeparator />
                    <Tooltip title="Show subitems">
                      <StyledButton
                        size="large"
                        icon={<Icon component={ListNested} />}
                        disabled={!mergeSimilar}
                        type={
                          mergeSimilar && showMerged ? "primary" : "secondary"
                        }
                        onClick={() => setShowMerged((i) => !i)}
                      />
                    </Tooltip>
                  </RoundSpacer>
                  <RoundSpacer>
                    <Tooltip title="Categorise results">
                      <StyledButton
                        size="large"
                        icon={<Icon component={Bucket} />}
                        type={categorise ? "primary" : "secondary"}
                        onClick={() => setCategorise((i) => !i)}
                      />
                    </Tooltip>
                    <FatSlider
                      value={categorise ? categoriseMaxScore : 0}
                      onChange={(value) => setCategoriseMaxScore(value)}
                      min={0}
                      max={100}
                      step={5}
                      disabled={!categorise}
                    />
                    <ViewMatchRulesButton
                      matchingRules={matchingRules}
                      categorisedProducts={categorisedProducts}
                    />
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
