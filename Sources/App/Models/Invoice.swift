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
	
	@Parent(key: "address_id")
	var address: Address
	
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
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, customerID: Customer.IDValue, addressID: Address.IDValue, total: Int?, paidStatus: Bool, status: InvoiceStatus, paymentMethod: PaymentMethod, createdAt: Date? = nil, updatedAt: Date? = nil) {
		self.id = id
		self.$customer.id = customerID
		self.$address.id = addressID
		self.total = total
		self.paidStatus = paidStatus
		self.status = status
		self.paymentMethod = paymentMethod
		self.createdAt = createdAt
		self.updatedAt = updatedAt
	}
	
	func toDTO() -> InvoiceDTO{
		return InvoiceDTO(id: self.id, customerID: self.$customer.id, addressID: self.$address.id, total: self.total, paidStatus: self.paidStatus, invoiceItems: self.$invoiceItems.value ?? [], status: self.status, paymentMethod: self.paymentMethod)
	}
}
