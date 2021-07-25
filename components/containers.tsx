import { Space } from "antd";
import styled from "styled-components";

export const RoundSpacer = styled(Space)({
  background: "#fff",
  borderRadius: "12px",
  padding: "8px",
});

export const RoundContainer = styled.div({
  background: "#fff",
  borderRadius: "12px",
  padding: "8px",
});

export const ContainerSeparator = styled.div({
  color: "#ccc",
  pointerEvents: "none",
  userSelect: "none",
});

ContainerSeparator.defaultProps = {
  children: "|",
};
