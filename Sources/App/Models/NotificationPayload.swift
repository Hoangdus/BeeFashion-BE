//
//  NotificationPayload.swift
//
//
//  Created by HoangDus on 03/05/2025.
//

import Foundation

struct NotificationPayload: Encodable {
	var message: message
}

struct message: Encodable {
	var token: String
	var notification: notification
}

struct notification: Encodable{
	var title: String
	var body: String
	var image: String
}
