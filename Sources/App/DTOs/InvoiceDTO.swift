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
	var total: Int?
	var paidStatus: Bool = false
//	var products: [ProductDTO]?
	var invoiceItemDTOs: [InvoiceItemDTO]? //receive
	var invoiceItems: [InvoiceItem]? //send
	var status: InvoiceStatus?
	var paymentMethod: PaymentMethod
	var createdAt: Date?
	
	func toModel() -> Invoice {
		return Invoice(customerID: self.customerID, fullAddress: self.fullAddress!, total: self.total, paidStatus: self.paidStatus, status: self.status ?? .pending, paymentMethod: self.paymentMethod)
	}
}
