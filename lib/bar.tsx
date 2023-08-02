import React, { ReactElement, useMemo } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import barcodes from 'jsbarcode/src/barcodes';

type FormatType =
  | 'CODE39'
  | 'CODE128'
  | 'CODE128A'
  | 'CODE128B'
  | 'CODE128C'
  | 'EAN13'
  | 'EAN8'
  | 'EAN5'
  | 'EAN2'
  | 'UPC'
  | 'UPCE'
  | 'ITF14'
  | 'ITF'
  | 'MSI'
  | 'MSI10'
  | 'MSI11'
  | 'MSI1010'
  | 'MSI1110'
  | 'pharmacode'
  | 'codabar'
  | 'GenericBarcode';

export type BarcodeProps = {
  value: string;
  width?: number;
  maxWidth: number;
  height?: number;
  format?: FormatType;
  lineColor?: string;
  background?: string;
  text?: string | ReactElement;
  containerStyle?: ViewStyle;
  onError?: (err: Error) => void;
  getRef?: (ref: any) => void;
};

export function Barcode({
  value,
  width = 2,
  height = 100,
  format = 'CODE128',
  lineColor = '#000000',
  background = '#ffffff',
  text,
  containerStyle,
  onError,
  getRef,
  maxWidth,
}: BarcodeProps) {
  const drawRect = (x: number, y: number, width: number, height: number) => {
    return `M${x},${y}h${width}v${height}h-${width}z`;
  };

  const drawSvgBarCode = (encoded: any) => {
    const rects: string[] = [];
    const { data: binary } = encoded;

    const barCodeWidth = binary.length * width;
    const singleBarWidth =
      typeof maxWidth === 'number' && barCodeWidth > maxWidth
        ? maxWidth / binary.length
        : width;
    let barWidth = 0;
    let x = 0;
    let yFrom = 0;

    for (let b = 0; b < binary.length; b++) {
      x = b * singleBarWidth;
      if (binary[b] === '1') {
        barWidth++;
      } else if (barWidth > 0) {
        rects[rects.length] = drawRect(
          x - singleBarWidth * barWidth,
          yFrom,
          singleBarWidth * barWidth,
          height,
        );
        barWidth = 0;
      }
    }

    if (barWidth > 0) {
      rects[rects.length] = drawRect(
        x - singleBarWidth * (barWidth - 1),
        yFrom,
        singleBarWidth * barWidth,
        height,
      );
    }

    return rects;
  };

  const encode = (text: string, Encoder: any) => {
    if (text.length === 0) {
      throw new Error('Barcode value must be a non-empty string');
    }

    const encoder = new Encoder(text, {
      width,
      format,
      height,
      lineColor,
      background,
      flat: true,
    });

    if (!encoder.valid()) {
      throw new Error('Invalid barcode for selected format.');
    }

    return encoder.encode();
  };

  const { bars, barCodeWidth } = useMemo(() => {
    try {
      const encoder = barcodes[format];
      if (!encoder) {
        throw new Error('Invalid barcode format.');
      }
      const encoded = encode(value, encoder);
      const barCodeWidth = encoded.data.length * width;
      return {
        bars: drawSvgBarCode(encoded),
        barCodeWidth:
          typeof maxWidth === 'number' && barCodeWidth > maxWidth
            ? maxWidth
            : barCodeWidth,
      };
    } catch (error) {
      if (__DEV__) {
        console.error(error.message);
      }

      if (onError) {
        onError(error);
      }
    }

    return {
      bars: [],
      barCodeWidth: 0,
    };
  }, [value, width, height, format, lineColor, background, maxWidth]);

  return (
    <View
      style={[
        { backgroundColor: background, alignItems: 'center' },
        containerStyle,
      ]}
    >
      <Svg ref={getRef} height={height} width={barCodeWidth} fill={lineColor}>
        <Path d={bars.join(' ')} />
      </Svg>
      {typeof text === 'string' ? (
        <Text style={{ textAlign: 'center' }}>{text}</Text>
      ) : (
        <>{text}</>
      )}
    </View>
  );
}
