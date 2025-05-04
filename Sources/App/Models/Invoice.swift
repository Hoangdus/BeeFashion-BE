//
//  Invoice.swift
//
//
//  Created by HoangDus on 11/03/2025.
//

import Vapor
import Fluent
import struct Foundation.UUID

enum InvoiceStatus: String, Codable {
	case pending, packing, intransit, completed, returned, cancelled, pendingcancel
}

enum PaymentMethod: String, Codable {
	case zalopay, cod
}

final class Invoice: Model, Content, @unchecked Sendable {
	static let schema = "invoices"
	
	@ID(key: .id)
	var id: UUID?

	@Parent(key: "customer_id")
	var customer: Customer
	
	@Field(key: "recipient_address")
	var recipientAddress: String
	
	@Field(key: "recipient_name")
	var recipientName: String
	
	@Field(key: "recipient_phone_number")
	var recipientPhoneNumber: String
	
	@Field(key: "total")
	var total: Int?
	
	@Field(key: "pay_status")
	var paidStatus: Bool
	
	@Children(for: \.$invoice)
	var invoiceItems: [InvoiceItem]
	
	@Enum(key: "status")
	var status: InvoiceStatus
	
	@Enum(key: "payment_method")
	var paymentMethod: PaymentMethod
	
	@Field(key: "target_device_token")
	var targetDeviceToken: String
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, customerID: Customer.IDValue, recipientAddress: String, recipientName: String, recipientPhoneNumber: String, total: Int? = nil, paidStatus: Bool, status: InvoiceStatus, paymentMethod: PaymentMethod, notificationToken: String, createdAt: Date? = nil, updatedAt: Date? = nil) {
		self.id = id
		self.$customer.id = customerID
		self.recipientAddress = recipientAddress
		self.recipientName = recipientName
		self.recipientPhoneNumber = recipientPhoneNumber
		self.total = total
		self.paidStatus = paidStatus
		self.status = status
		self.paymentMethod = paymentMethod
		self.targetDeviceToken = notificationToken
		self.createdAt = createdAt
		self.updatedAt = updatedAt
	}
	
	func toDTO() -> InvoiceDTO{
		return InvoiceDTO(id: self.id, customerID: self.$customer.id, addressID: UUID(), fullAddress: self.recipientAddress, recipientName: self.recipientName, recipientPhoneNumber: self.recipientPhoneNumber, total: self.total, paidStatus: self.paidStatus, invoiceItems: self.$invoiceItems.value ?? [], status: self.status, paymentMethod: self.paymentMethod, targetDeviceToken: self.targetDeviceToken, createdAt: self.createdAt)
	}
}
