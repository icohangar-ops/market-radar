import {
  render, Text, Heading, Strong, Badge, StatusLozenge, SectionMessage,
  Table, Head, Cell, Row, ProgressBar, Fragment, Tabs, Tab,
} from '@forge/ui';

function fmtFlow(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}$${(Math.abs(n) / 1e9).toFixed(1)}B`;
}

function SentimentBar({ value }) {
  const pct = Math.round(value * 100);
  const color = value > 0.6 ? 'green' : value > 0.4 ? 'yellow' : 'red';
  const label = value > 0.7 ? 'BULLISH' : value > 0.6 ? 'CAUTIOUSLY OPTIMISTIC' : value > 0.4 ? 'NEUTRAL' : value > 0.3 ? 'CAUTIOUS' : 'BEARISH';
  return (
    <Fragment>
      <Text>Sentiment Composite: <Strong>{label}</Strong> ({value.toFixed(2)})</Text>
      <ProgressBar value={pct} />
    </Fragment>
  );
}

function SignalBadge({ signal }) {
  const map = { bullish: 'success', bearish: 'removed', neutral: 'default' };
  return <StatusLozenge text={signal?.toUpperCase()} appearance={map[signal] || 'default'} />;
}

export const handler = async (data) => {
  const { sentiment, fedPolicy, sectorRotation, alerts } = data;

  return (
    <Fragment>
      <Heading size="medium">Market Radar</Heading>
      <Text appearance="subtle">Updated: {new Date(data.lastUpdated).toLocaleDateString()}</Text>

      <SentimentBar value={sentiment.composite} />

      {alerts?.length > 0 && alerts.map((a, i) => (
        <SectionMessage key={i} appearance={a.type === 'warning' ? 'warning' : 'info'} title={a.type === 'warning' ? '⚠ Alert' : 'ℹ Info'}>
          <Text>{a.message}</Text>
          <Text appearance="subtle">{a.since}</Text>
        </SectionMessage>
      ))}

      <Tabs>
        <Tab label="Sentiment Indicators">
          <Table>
            <Head>
              <Cell><Text size="small"><Strong>Indicator</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>Value</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>Signal</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>Trend</Strong></Text></Cell>
            </Head>
            {sentiment.indicators.map((ind, i) => (
              <Row key={i}>
                <Cell><Text><Strong>{ind.name}</Strong></Text></Cell>
                <Cell><Text>{ind.value}</Text></Cell>
                <Cell><SignalBadge signal={ind.signal} /></Cell>
                <Cell><Text appearance="subtle">{ind.direction}</Text></Cell>
              </Row>
            ))}
          </Table>
        </Tab>

        <Tab label="Fed Policy">
          <Text>Current Rate: <Strong>{fedPolicy.currentRate}%</Strong></Text>
          <Text>Stance: <Badge text={fedPolicy.stance} appearance="removed" /></Text>
          <Text>Next FOMC: <Strong>{fedPolicy.nextMeeting}</Strong></Text>
          <Text>Implied Cut: <Strong>{fedPolicy.impliedCut}%</Strong></Text>
          <Table>
            <Head>
              <Cell><Text size="small"><Strong>Dot Plot Median</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>2026</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>2027</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>2028</Strong></Text></Cell>
            </Head>
            <Row>
              <Cell><Text>Fed Funds Rate</Text></Cell>
              <Cell><Text><Strong>{fedPolicy.dotPlot.median2026}%</Strong></Text></Cell>
              <Cell><Text><Strong>{fedPolicy.dotPlot.median2027}%</Strong></Text></Cell>
              <Cell><Text><Strong>{fedPolicy.dotPlot.median2028}%</Strong></Text></Cell>
            </Row>
          </Table>
          {fedPolicy.recentSpeech && (
            <SectionMessage title={`Latest: ${fedPolicy.recentSpeech.speaker} (${fedPolicy.recentSpeech.date})`} appearance="info">
              <Text>{fedPolicy.recentSpeech.summary}</Text>
              <Text>Tone: <Badge text={fedPolicy.recentSpeech.tone} /></Text>
            </SectionMessage>
          )}
        </Tab>

        <Tab label="Sector Rotation">
          <Table>
            <Head>
              <Cell><Text size="small"><Strong>Sector</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>Flow</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>Direction</Strong></Text></Cell>
              <Cell><Text size="small"><Strong>Weight</Strong></Text></Cell>
            </Head>
            {sectorRotation
              .sort((a, b) => b.flow - a.flow)
              .map((s, i) => (
                <Row key={i}>
                  <Cell><Text><Strong>{s.sector}</Strong></Text></Cell>
                  <Cell>
                    <Text style={{ color: s.direction === 'inflow' ? 'green' : 'red' }}>
                      <Strong>{fmtFlow(s.flow)}</Strong>
                    </Text>
                  </Cell>
                  <Cell>
                    <Badge text={s.direction === 'inflow' ? 'INFLOW' : 'OUTFLOW'} appearance={s.direction === 'inflow' ? 'success' : 'removed'} />
                  </Cell>
                  <Cell><Text>{s.weight}%</Text></Cell>
                </Row>
              ))}
          </Table>
        </Tab>
      </Tabs>
    </Fragment>
  );
};

export default handler;
