import styled from "styled-components";
import { Slider } from "antd";
import { SliderSingleProps } from "antd/lib/slider";
import { blue } from '@ant-design/colors';

interface FatSliderWrapperProps {
  heightPx?: string;
}

const FatSliderWrapper = styled.div<FatSliderWrapperProps>`
  width: 100px;
  & > .ant-slider {
    border-radius: 10px;
    overflow: hidden;
    margin: 0;
    height: ${(props: FatSliderWrapperProps) => props.heightPx};
    padding: 0;
    .ant-slider-track {
      height: ${(props: FatSliderWrapperProps) => props.heightPx};
      background-color: ${blue.primary};
    }
    .ant-slider-step {
      height: ${(props: FatSliderWrapperProps) => props.heightPx};
    }
    .ant-slider-rail {
      height: ${(props: FatSliderWrapperProps) => props.heightPx};
    }
    .ant-slider-handle {
      width: 20px;
      height: ${(props: FatSliderWrapperProps) => props.heightPx};
      border-radius: 5px;
      margin-top: 0;
      opacity: 0;
      transition: opacity 200ms;
    }
    &:hover .ant-slider-handle {
      opacity: 1;
    }
  }
`;

interface FatSliderProps extends SliderSingleProps {
  height?: string;
}

export function FatSlider({ height = "40px", ...sliderProps }: FatSliderProps) {
  return (
    <FatSliderWrapper heightPx={height}>
      <Slider {...sliderProps} />
    </FatSliderWrapper>
  );
}
