import React, { useMemo } from 'react';
import QRC, { QRCodeErrorCorrectionLevel } from 'qrcode';
import Svg, {
  Defs,
  G,
  Path,
  Rect,
  Image,
  ClipPath,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export type LogoProps = {
  size: number;
  logo: string;
  logoSize: number;
  logoBackgroundColor: string;
  logoMargin: number;
  logoBorderRadius: number;
};

export type QRCodeProps = {
  value: string;
  size: number;
  color: string;
  backgroundColor: string;
  logo: string;
  logoSize: number;
  logoBackgroundColor: string;
  logoMargin: number;
  logoBorderRadius: number;
  quietZone: number;
  enableLinearGradient: boolean;
  gradientDirection: string[];
  linearGradient: string[];
  ecl: QRCodeErrorCorrectionLevel;
  getRef: (ref: any) => void;
  onError: (error: Error) => void;
};

function genMatrix(
  value: string,
  errorCorrectionLevel: QRCodeErrorCorrectionLevel,
) {
  const arr = Array.prototype.slice.call(
    QRC.create(value, { errorCorrectionLevel }).modules.data,
    0,
  );
  const sqrt = Math.sqrt(arr.length);
  return arr.reduce(
    (rows, key, index) =>
      (index % sqrt === 0
        ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows,
    [],
  );
}

function transformMatrixIntoPath(matrix: any[], size: number) {
  const cellSize = size / matrix.length;
  let path = '';
  matrix.forEach((row, i) => {
    let needDraw = false;
    row.forEach((column, j) => {
      if (column) {
        if (!needDraw) {
          path += `M${cellSize * j} ${cellSize / 2 + cellSize * i} `;
          needDraw = true;
        }
        if (needDraw && j === matrix.length - 1) {
          path += `L${cellSize * (j + 1)} ${cellSize / 2 + cellSize * i} `;
        }
      } else {
        if (needDraw) {
          path += `L${cellSize * j} ${cellSize / 2 + cellSize * i} `;
          needDraw = false;
        }
      }
    });
  });
  return {
    cellSize,
    path,
  };
}

function renderLogo({
  size,
  logo,
  logoSize,
  logoBackgroundColor,
  logoMargin,
  logoBorderRadius,
}: LogoProps) {
  const logoPosition = (size - logoSize - logoMargin * 2) / 2;
  const logoBackgroundSize = logoSize + logoMargin * 2;
  const logoBackgroundBorderRadius =
    logoBorderRadius + (logoMargin / logoSize) * logoBorderRadius;

  return (
    <G x={logoPosition} y={logoPosition}>
      <Defs>
        <ClipPath id="clip-logo-background">
          <Rect
            width={logoBackgroundSize}
            height={logoBackgroundSize}
            rx={logoBackgroundBorderRadius}
            ry={logoBackgroundBorderRadius}
          />
        </ClipPath>
        <ClipPath id="clip-logo">
          <Rect
            width={logoSize}
            height={logoSize}
            rx={logoBorderRadius}
            ry={logoBorderRadius}
          />
        </ClipPath>
      </Defs>
      <G>
        <Rect
          width={logoBackgroundSize}
          height={logoBackgroundSize}
          fill={logoBackgroundColor}
          clipPath="url(#clip-logo-background)"
        />
      </G>
      <G x={logoMargin} y={logoMargin}>
        <Image
          width={logoSize}
          height={logoSize}
          preserveAspectRatio="xMidYMid slice"
          href={logo}
          clipPath="url(#clip-logo)"
        />
      </G>
    </G>
  );
}

export function QRCode({
  value = 'this is a QR code',
  size = 100,
  color = 'black',
  backgroundColor = 'white',
  logo,
  logoSize = size * 0.2,
  logoBackgroundColor = 'transparent',
  logoMargin = 2,
  logoBorderRadius = 0,
  quietZone = 0,
  enableLinearGradient = false,
  gradientDirection = ['0%', '0%', '100%', '100%'],
  linearGradient = ['rgb(255,0,0)', 'rgb(0,255,255)'],
  ecl = 'M',
  getRef,
  onError,
}: QRCodeProps) {
  const result = useMemo(() => {
    try {
      return transformMatrixIntoPath(genMatrix(value, ecl), size);
    } catch (error) {
      if (onError && typeof onError === 'function') {
        onError(error);
      } else {
        // Pass the error when no handler presented
        throw error;
      }
    }
  }, [value, size, ecl]);

  if (!result) {
    return null;
  }

  const { path, cellSize } = result;

  return (
    <Svg
      ref={getRef}
      viewBox={[
        -quietZone,
        -quietZone,
        size + quietZone * 2,
        size + quietZone * 2,
      ].join(' ')}
      width={size}
      height={size}
    >
      <Defs>
        <LinearGradient
          id="grad"
          x1={gradientDirection[0]}
          y1={gradientDirection[1]}
          x2={gradientDirection[2]}
          y2={gradientDirection[3]}
        >
          <Stop offset="0" stopColor={linearGradient[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={linearGradient[1]} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <G>
        <Rect
          x={-quietZone}
          y={-quietZone}
          width={size + quietZone * 2}
          height={size + quietZone * 2}
          fill={backgroundColor}
        />
      </G>
      <G>
        <Path
          d={path}
          strokeLinecap="butt"
          stroke={enableLinearGradient ? 'url(#grad)' : color}
          strokeWidth={cellSize}
        />
      </G>
      {logo &&
        renderLogo({
          size,
          logo,
          logoSize,
          logoBackgroundColor,
          logoMargin,
          logoBorderRadius,
        })}
    </Svg>
  );
}
