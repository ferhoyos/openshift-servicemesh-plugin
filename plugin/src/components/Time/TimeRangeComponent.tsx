import * as React from 'react';

import {
  DurationInSeconds,
  BoundsInMilliseconds,
  guardTimeRange,
  TimeRange,
  durationToBounds,
  isEqualTimeRange,
  serverConfig,
  humanDurations,
  KialiAppState,
  timeRangeSelector,
  KialiDispatch,
  UserSettingsActions
} from '@kiali/types';
import { ToolbarDropdown } from '../ToolbarDropdown/ToolbarDropdown';
import { retrieveTimeRange, storeTimeRange } from './TimeRangeHelper';
import { DateTimePicker } from './DateTimePicker';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { style } from 'typestyle';

type Props = {
  manageURL?: boolean;
  menuAppendTo?: HTMLElement | (() => HTMLElement) | 'parent' | 'inline';
  timeRange: TimeRange;
  tooltip: string;
  setTimeRange: (range: TimeRange) => void;
};

const labelStyle = style({
  margin: '5px 5px 0px 5px'
});

export class TimeRangeComponent extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    const range = retrieveTimeRange();
    if ((range.rangeDuration !== undefined || range.from !== undefined) && !isEqualTimeRange(props.timeRange, range)) {
      this.props.setTimeRange(range);
    }
    this.storeTimeRange(this.props.timeRange);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.timeRange !== this.props.timeRange) {
      this.storeTimeRange(this.props.timeRange);
    }
  }

  onDurationChanged = (key: string) => {
    let range: TimeRange = {};
    if (key === 'custom') {
      // Convert to bounds
      range = guardTimeRange(range, durationToBounds, b => b);
      range.rangeDuration = undefined;
    } else {
      range.rangeDuration = Number(key);
      range.from = undefined;
      range.to = undefined;
    }
    this.props.setTimeRange(range);
  };

  onStartPickerChanged = (d?: Date) => {
    let range: TimeRange = {};
    if (d) {
      range = guardTimeRange(range, durationToBounds, b => b);
      range.from = d.getTime();
      if (range.to && range.from > range.to) {
        range.from = range.to;
      }
      range.rangeDuration = undefined;
      this.props.setTimeRange(range);
    }
  };

  onEndPickerChanged = (d?: Date) => {
    const range = guardTimeRange(this.props.timeRange, durationToBounds, b => b);
    range.to = d ? d.getTime() : undefined;
    if (range.to && range.from && range.from > range.to) {
      range.to = range.from;
    }
    this.props.setTimeRange(range);
  };

  render() {
    return guardTimeRange(
      this.props.timeRange,
      d => this.renderDuration(d),
      ft => this.renderWithCustom(ft)
    );
  }

  renderDuration(d?: DurationInSeconds) {
    const durations = humanDurations(serverConfig, 'Last', undefined);
    const options = { custom: 'Custom', ...durations };
    return (
      <ToolbarDropdown
        id={'metrics_filter_interval_duration'}
        handleSelect={this.onDurationChanged}
        initialValue={d || 'custom'}
        value={d || 'custom'}
        initialLabel={d ? serverConfig.durations[d] : 'Custom'}
        options={options}
        tooltip={this.props.tooltip}
        menuAppendTo={this.props.menuAppendTo}
      />
    );
  }

  renderWithCustom(bounds: BoundsInMilliseconds) {
    return (
      <>
        {this.renderDuration()}
        <div className={labelStyle}>From</div>
        <DateTimePicker selected={bounds.from} onChange={date => this.onStartPickerChanged(date)} maxDate={bounds.to} />
        <div className={labelStyle}>To</div>
        <DateTimePicker selected={bounds.to} onChange={date => this.onEndPickerChanged(date)} minDate={bounds.from} />
      </>
    );
  }

  private storeTimeRange(timeRange: TimeRange) {
    if (this.props.manageURL) {
      storeTimeRange(timeRange);
    }
  }
}

const mapStateToProps = (state: KialiAppState) => {
  return {
    timeRange: timeRangeSelector(state)
  };
};

const mapDispatchToProps = (dispatch: KialiDispatch) => {
  return {
    setTimeRange: bindActionCreators(UserSettingsActions.setTimeRange, dispatch)
  };
};

const TimeRangeContainer = connect(mapStateToProps, mapDispatchToProps)(TimeRangeComponent);
export default TimeRangeContainer;