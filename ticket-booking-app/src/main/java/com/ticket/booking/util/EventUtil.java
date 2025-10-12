package com.ticket.booking.util;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.ticket.booking.entity.Events;
import com.ticket.booking.vo.ViewEventsVo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class EventUtil {


	public List<ViewEventsVo> mapEventDetails(List<Events> list) {
		List<ViewEventsVo> eventslist = new ArrayList<>();
		for(Events events : list) {
			log.info("event {}",events.getEventName() );
			eventslist.add(ViewEventsVo.builder().eventId(events.getEventId())
					.eventName(events.getEventName()).availableTickets(events.getAvailableTickets())
					.conductedBy(events.getConductedBy()).eventDate(events.getEventDate())
					.eventStatus(events.getEventStatus())
					.eventType(events.getEventType())
					.location(events.getLocation())
					.build());
		}
		return eventslist;
	}


}
