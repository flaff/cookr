import Icon from "@ant-design/icons";
import { Space } from "antd";
import Modal from "antd/lib/modal/Modal";
import { useState } from "react";
import { InfoCircle } from "react-bootstrap-icons";
import { IngredientCategoryMatchingRule } from "../contentful/ingredientCategoryMatchingRule";
import { RoundContainer } from "./containers";
import { Product } from "./LinesToMd";
import { StyledButton } from "./StyledButton";

interface ViewMatchRulesButtonProps {
  matchingRules: IngredientCategoryMatchingRule[];
  categorisedProducts: { [category: string]: Product[] };
}

export function ViewMatchRulesButton({
  matchingRules,
  categorisedProducts,
}: ViewMatchRulesButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <>
      <StyledButton
        size="large"
        icon={<Icon component={InfoCircle} />}
        onClick={openModal}
        type="link"
      />
      {modalVisible && (
        <Modal
          title="Matching rules"
          visible
          onOk={closeModal}
          onCancel={closeModal}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {matchingRules.map((matchRule) => {
              const products = categorisedProducts[
                matchRule.category.name
              ]?.filter((product) => product.match === matchRule.contains);

              return (
                <div>
                  <b>
                    <code>{matchRule.contains}</code> {matchRule.category.name}
                  </b>
                  {products?.length > 0 && (
                    <RoundContainer style={{ background: "#f5f5ff" }}>
                      {products.map(
                        (product) => `${product.name} ${product.matchScore}`
                      )}
                    </RoundContainer>
                  )}
                </div>
              );
            })}
          </Space>
        </Modal>
      )}
    </>
  );
}
