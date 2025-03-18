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
	var total: Int?
	var paidStatus: Bool = false
//	var products: [ProductDTO]?
	var invoiceItemDTOs: [InvoiceItemDTO]?
	var invoiceItems: [InvoiceItem]?
	var status: InvoiceStatus?
	var paymentMethod: PaymentMethod
	
	func toModel() -> Invoice {
		return Invoice(customerID: self.customerID, addressID: self.addressID, total: self.total, paidStatus: self.paidStatus, status: self.status ?? .pending, paymentMethod: self.paymentMethod)
	}
}
