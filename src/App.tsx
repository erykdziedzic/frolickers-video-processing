import { Button, Layout, Progress, Space } from 'antd';
import styled, { createGlobalStyle } from 'styled-components';
import { useEffect, useState } from 'react';

const GlobalStyle = createGlobalStyle`
body {
  margin: 0;
  padding: 0;
}
`;

const Content = styled(Layout.Content)`
  padding: 24px;
`;

const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const App = () => {
  const [outputPath, setOutputPath] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeInfo, setTimeInfo] = useState<{
    processed: number;
    total: number;
  }>();

  useEffect(() => {
    window.electronAPI.onProgress((progressData) => {
      setProgress(progressData.percentage);
      setTimeInfo({
        processed: progressData.timeProcessed,
        total: progressData.duration,
      });
    });
  }, []);

  const selectOutputPath = async () => {
    const { canceled, path } = await window.electronAPI.openDirectory();
    if (!canceled && path) return setOutputPath(path);
  };

  const selectDesktopVideo = async () => {
    setLoading(true);
    setProgress(0);
    const { canceled, filePath } = await window.electronAPI.openFile();
    if (canceled || !filePath) return setLoading(false);
    try {
      await window.electronAPI.processDesktopFile(filePath, outputPath);
    } catch (error) {
      console.error('Processing failed:', error);
    }
    setLoading(false);
    setProgress(0);
    setTimeInfo(undefined);
  };

  const processMobileVideo = async () => {
    setLoading(true);
    setProgress(0);
    const { canceled, filePath } = await window.electronAPI.openFile();
    if (canceled || !filePath) return setLoading(false);
    try {
      await window.electronAPI.processMobileFile(filePath, outputPath);
    } catch (error) {
      console.error('Processing failed:', error);
    }
    setLoading(false);
    setProgress(0);
    setTimeInfo(undefined);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <GlobalStyle />
      <Layout.Header />
      <Content>
        <Space direction="vertical" size="large">
          <Button type="primary" onClick={selectOutputPath} loading={loading}>
            Select Output Path
          </Button>
          {loading && (
            <div>
              <Progress percent={progress} status="active" />
              {timeInfo && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  {formatTime(timeInfo.processed)} / {formatTime(timeInfo.total)}
                </div>
              )}
            </div>
          )}
          <Button type="primary" onClick={selectDesktopVideo} loading={loading} disabled={!outputPath}>
            Process Desktop Video
          </Button>
          <Button type="primary" onClick={processMobileVideo} loading={loading} disabled={!outputPath}>
            Process Mobile Video
          </Button>
        </Space>
      </Content>
    </Layout>
  );
};
