//
//  OAuthToken.swift
//
//
//  Created by HoangDus on 04/05/2025.
//

import struct Foundation.UUID
import Fluent
import Vapor

final class OAuthToken: Model, @unchecked Sendable{
	static let schema = "oauthtokens"
	
	@ID(key: .id)
	var id: UUID?
	
	@Field(key: "token")
	var token: String
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, token: String, createdAt: Date? = nil) {
		self.id = id
		self.token = token
		self.createdAt = createdAt
	}
}
