import { notifications } from '@mantine/notifications';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';

// Thông báo thành công sau khi trích xuất
export const showSuccessNotification = () => {
  notifications.show({
    title: 'Trích xuất thành công',
    message: 'Dữ liệu dinh dưỡng đã được lưu và tải xuống',
    color: 'teal',
    icon: <IconCheck size="1.1rem" />,
    autoClose: 3000
  });
};

// Thông báo lỗi
export const showErrorNotification = (errorMsg: string) => {
  notifications.show({
    title: 'Lỗi trích xuất',
    message: errorMsg,
    color: 'red',
    icon: <IconAlertCircle size="1.1rem" />,
    autoClose: 4000
  });
};
