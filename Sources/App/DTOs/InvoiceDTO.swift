//
//  InvoiceDTO.swift
//
//
//  Created by HoangDus on 11/03/2025.
//

import Fluent
import Vapor

struct InvoiceDTO: Content {
	var id: UUID?
	var customerID: UUID
	var addressID: UUID
	var fullAddress: String?
	var recipientName: String?
	var recipientPhoneNumber: String?
	var total: Int?
	var paidStatus: Bool = false
//	var products: [ProductDTO]?
	var invoiceItemDTOs: [InvoiceItemDTO]? //receive
	var invoiceItems: [InvoiceItem]? //send
	var status: InvoiceStatus?
	var paymentMethod: PaymentMethod
	var createdAt: Date?
	
	func toModel() -> Invoice {
		return Invoice(id: self.id, customerID: self.customerID, recipientAddress: self.fullAddress!, recipientName: self.recipientName!, recipientPhoneNumber: self.recipientPhoneNumber!, total: self.total, paidStatus: self.paidStatus, status: self.status ?? .pending, paymentMethod: self.paymentMethod)
	}
}
