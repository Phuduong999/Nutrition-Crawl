import React from 'react';
import { Card, Stepper, Tooltip, rem, Box, ScrollArea } from '@mantine/core';
import { IconShieldCheck, IconRobot, IconCheck } from '@tabler/icons-react';
import UploadStep from './UploadStep';
import ProcessingStep from './ProcessingStep';
import ResultsStep from './ResultsStep';
import type { ExcelRow } from '../../types';

interface BatchImportStepperProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  excelData: ExcelRow[];
  processedData: ExcelRow[];
  isProcessing: boolean;
  error: string | null;
  onlyTrustedSources: boolean;
  setOnlyTrustedSources: (value: boolean) => void;
  handleFileUpload: (rows: ExcelRow[]) => void;
  handleStartProcessing: () => void;
  handleReset: () => void;
}

const BatchImportStepper: React.FC<BatchImportStepperProps> = ({
  activeStep,
  setActiveStep,
  excelData,
  processedData,
  isProcessing,
  error,
  onlyTrustedSources,
  setOnlyTrustedSources,
  handleFileUpload,
  handleStartProcessing,
  handleReset
}) => {
  // Tạo custom step icon nhỏ gọn hơn
  const getStepIcon = (icon: React.ReactNode, label: string) => (
    <Tooltip label={label}>
      {icon}
    </Tooltip>
  );

  return (
    <Box style={{ height: '350px', overflow: 'hidden', padding: '0 4px' }}>
      <ScrollArea style={{ height: '100%' }} type="auto" scrollbarSize={6} scrollHideDelay={2500}>
        <Card shadow="sm" p="md" radius="md" withBorder style={{ backgroundColor: 'white' }} mb="md">
          <Box mb="md">
            <Stepper 
              active={activeStep} 
              onStepClick={setActiveStep} 
              size="xs"
              iconSize={18}
              styles={{
                stepBody: {
                  display: isProcessing ? 'none' : undefined
                },
                step: {
                  padding: rem(4),
                  flexBasis: '33.333333%'
                },
                separator: {
                  marginLeft: rem(4),
                  marginRight: rem(4)
                }
              }}
            >
              <Stepper.Step
                label="Tải lên"
                description="Chọn file Excel"
                icon={getStepIcon(<IconShieldCheck size="1rem" />, "Bước 1: Tải lên file Excel có chứa URL")}
                allowStepSelect={!isProcessing}
              >
                <UploadStep
                  onFileUpload={handleFileUpload}
                  error={error}
                  onlyTrustedSources={onlyTrustedSources}
                  setOnlyTrustedSources={setOnlyTrustedSources}
                />
              </Stepper.Step>
              
              <Stepper.Step
                label="Xử lý"
                description="Trích xuất thông tin"
                icon={getStepIcon(<IconRobot size="1rem" />, "Bước 2: Xử lý và trích xuất dữ liệu từ các URL")}
                allowStepSelect={!isProcessing && excelData.length > 0}
              >
                <ProcessingStep
                  excelData={excelData}
                  processedData={processedData}
                  isProcessing={isProcessing}
                  error={error}
                  onlyTrustedSources={onlyTrustedSources}
                  onStartProcessing={handleStartProcessing}
                  onNextStep={() => setActiveStep(2)}
                  onPrevStep={() => setActiveStep(0)}
                />
              </Stepper.Step>
              
              <Stepper.Step
                label="Kết quả"
                description="Xem và xuất kết quả"
                icon={getStepIcon(<IconCheck size="1rem" />, "Bước 3: Xem và xuất kết quả trích xuất")}
                allowStepSelect={!isProcessing && processedData.filter(row => row.status === 'completed').length > 0}
              >
                <ResultsStep
                  processedData={processedData}
                  onReset={handleReset}
                  onPrevStep={() => setActiveStep(1)}
                />
              </Stepper.Step>
            </Stepper>
          </Box>
        </Card>
      </ScrollArea>
    </Box>
  );
};

export default BatchImportStepper;
