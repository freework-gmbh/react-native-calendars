import React, { PureComponent } from 'react';
import {
  Text,
  View,
  Dimensions,
  Animated,
  ViewPropTypes,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import XDate from 'xdate';

import { parseDate, xdateToData } from '../interface';
import dateutils from '../dateutils';
import CalendarList from '../calendar-list';
import ReservationsList from './reservation-list';
import styleConstructor from './style';
import { VelocityTracker } from '../input';

const HEADER_HEIGHT = 104;

export default class AgendaView extends PureComponent {
  constructor(props) {
    super(props);
    this.styles = styleConstructor(props.theme);
    const windowSize = Dimensions.get('window');
    this.viewHeight = windowSize.height;
    this.viewWidth = windowSize.width;
    this.scrollTimeout = undefined;
    this.state = {
      scrollY: new Animated.Value(0),
      calendarIsReady: false,
      calendarScrollable: false,
      firstResevationLoad: false,
      selectedDay: parseDate(this.props.selected) || XDate(true),
      topDay: parseDate(this.props.selected) || XDate(true),
    };
    this.currentMonth = this.state.selectedDay.clone();
    this.generateMarkings = this.generateMarkings.bind(this);
  }

  calendarOffset() {
    return 90 - this.viewHeight / 2;
  }

  initialScrollPadPosition() {
    return Math.max(0, this.viewHeight - HEADER_HEIGHT);
  }

  setScrollPadPosition(y, animated) {}

  onVisibleMonthsChange(months) {
    if (this.props.items && !this.state.firstResevationLoad) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        if (this.props.loadItemsForMonth && this._isMounted) {
          this.props.loadItemsForMonth(months[0]);
        }
      }, 200);
    }
  }

  loadReservations(props) {
    if (
      (!props.items || !Object.keys(props.items).length) &&
      !this.state.firstResevationLoad
    ) {
      this.setState(
        {
          firstResevationLoad: true,
        },
        () => {
          if (this.props.loadItemsForMonth) {
            this.props.loadItemsForMonth(xdateToData(this.state.selectedDay));
          }
        },
      );
    }
  }

  componentWillMount() {
    this._isMounted = true;
    this.loadReservations(this.props);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentWillReceiveProps(props) {
    if (props.items) {
      this.setState({
        firstResevationLoad: false,
      });
    } else {
      this.loadReservations(props);
    }
  }

  _chooseDayFromCalendar(d) {
    this.setState({ isOpenCalendar: false });
    this.chooseDay(d, !this.state.calendarScrollable);
  }

  chooseDay(d, optimisticScroll) {
    const day = parseDate(d);
    this.setState({
      calendarScrollable: false,
      selectedDay: day.clone(),
    });
    if (this.props.onCalendarToggled) {
      this.props.onCalendarToggled(false);
    }
    if (!optimisticScroll) {
      this.setState({
        topDay: day.clone(),
      });
    }
    this.setScrollPadPosition(this.initialScrollPadPosition(), true);
    this.calendar.scrollToDay(day, this.calendarOffset(), true);
    if (this.props.loadItemsForMonth) {
      this.props.loadItemsForMonth(xdateToData(day));
    }
    if (this.props.onDayPress) {
      this.props.onDayPress(xdateToData(day));
    }
  }

  onDayChange(day) {
    const newDate = parseDate(day);
    const withAnimation = dateutils.sameMonth(newDate, this.state.selectedDay);
    this.calendar.scrollToDay(day, this.calendarOffset(), withAnimation);
    this.setState({
      selectedDay: parseDate(day),
      isOpenCalendar: false,
    });

    if (this.props.onDayChange) {
      this.props.onDayChange(xdateToData(newDate));
    }
  }

  generateMarkings() {
    let markings = this.props.markedDates;
    if (!markings) {
      markings = {};
      Object.keys(this.props.items || {}).forEach(key => {
        if (this.props.items[key] && this.props.items[key].length) {
          markings[key] = { marked: true };
        }
      });
    }
    const key = this.state.selectedDay.toString('yyyy-MM-dd');
    return {
      ...markings,
      [key]: { ...(markings[key] || {}), ...{ selected: true } },
    };
  }

  render() {
    const agendaHeight = Math.max(0, this.viewHeight - HEADER_HEIGHT);
    const weekDaysNames = dateutils.weekDayNames(this.props.firstDay);
    const weekdaysStyle = [
      this.styles.weekdays,
      {
        opacity: this.state.scrollY.interpolate({
          inputRange: [agendaHeight - HEADER_HEIGHT, agendaHeight],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: this.state.scrollY.interpolate({
              inputRange: [
                Math.max(0, agendaHeight - HEADER_HEIGHT),
                agendaHeight,
              ],
              outputRange: [-HEADER_HEIGHT, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
    ];

    const headerTranslate = this.state.scrollY.interpolate({
      inputRange: [0, agendaHeight],
      outputRange: [agendaHeight, 0],
      extrapolate: 'clamp',
    });

    const contentTranslate = this.state.scrollY.interpolate({
      inputRange: [0, agendaHeight],
      outputRange: [0, agendaHeight / 2],
      extrapolate: 'clamp',
    });

    const headerStyle = [
      this.styles.header,
      { bottom: agendaHeight, transform: [{ translateY: headerTranslate }] },
    ];

    if (!this.state.calendarIsReady) {
      // limit header height until everything is setup for calendar dragging
      headerStyle.push({ height: 0 });
      // fill header with appStyle.calendarBackground background to reduce flickering
      weekdaysStyle.push({ height: HEADER_HEIGHT });
    }

    const scrollPadStyle = {
      position: 'absolute',
      width: 80,
      left: (this.viewWidth - 80) / 2,
    };

    const selectedDayTimestamp = xdateToData(this.state.selectedDay)
      ? xdateToData(this.state.selectedDay).timestamp
      : null;

    return (
      <>
        <TouchableOpacity
          style={this.styles.header}
          onPress={() =>
            this.setState({ isOpenCalendar: !this.state.isOpenCalendar })
          }>
          {this.props.renderCalendarToggle(selectedDayTimestamp)}
        </TouchableOpacity>
        <View
          style={
            this.state.isOpenCalendar ? {} : { opacity: 0, height: 0, width: 0 }
          }>
          <CalendarList
            theme={this.props.theme}
            onVisibleMonthsChange={this.onVisibleMonthsChange.bind(this)}
            ref={c => (this.calendar = c)}
            minDate={this.props.minDate}
            maxDate={this.props.maxDate}
            current={this.currentMonth}
            markedDates={this.generateMarkings()}
            markingType={this.props.markingType}
            removeClippedSubviews={this.props.removeClippedSubviews}
            onDayPress={this._chooseDayFromCalendar.bind(this)}
            hideExtraDays
            firstDay={this.props.firstDay}
            monthFormat={this.props.monthFormat}
            pastScrollRange={this.props.pastScrollRange}
            futureScrollRange={this.props.futureScrollRange}
            dayComponent={this.props.dayComponent}
            disabledByDefault={this.props.disabledByDefault}
            displayLoadingIndicator={this.props.displayLoadingIndicator}
          />
        </View>
        <View style={this.styles.reservations}>
          <ReservationsList
            rowHasChanged={this.props.rowHasChanged}
            renderItem={this.props.renderItem}
            renderDay={this.props.renderDay}
            renderEmptyDate={this.props.renderEmptyDate}
            reservations={this.props.items}
            selectedDay={this.state.selectedDay}
            renderEmptyData={this.props.renderEmptyData}
            topDay={this.state.topDay}
            onDayChange={this.onDayChange.bind(this)}
            onScroll={() => {}}
            ref={c => (this.list = c)}
            theme={this.props.theme}
          />
        </View>
      </>
    );
  }
}

AgendaView.defaultProps = {
  renderCalendarToggle: () => null,
};
