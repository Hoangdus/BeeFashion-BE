//
//  InvoiceController.swift
//
//
//  Created by HoangDus on 11/03/2025.
//

import Fluent
import Vapor

struct InvoiceController: RouteCollection {
	func boot(routes: RoutesBuilder) throws {
		let invoices = routes.grouped("invoices")

		invoices.get(":customerID", use: self.index)
		invoices.post(use: self.create)
		
		invoices.group(":customerID",":invoiceID") { invoice in
			invoice.delete(use: self.delete)
		}
	}

	@Sendable
	func index(req: Request) async throws -> [InvoiceDTO] {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.notFound) }
		let invoices = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$customer.$id == customerID).all()
		var invoiceDTOs: [InvoiceDTO] = []
		
		for invoice in invoices{
			let productIDs = invoice.invoiceItems.map{ $0.$product.$id.wrappedValue }
			let products = try await Product.query(on: req.db).filter(\.$id ~~ productIDs).with(\.$productDetail).all()
			var productDTOs: [ProductDTO] = []
			
			for product in products{
				let productDetail = product.productDetail
				if (productDetail != nil){
					var productDTO = product.toDTO()
					productDTO.quantities = productDetail?.quantities
					productDTO.price = productDetail?.price
					productDTOs.append(productDTO)
				}
			}
			
			var invoiceDTO = invoice.toDTO()
			invoiceDTO.products = productDTOs
			invoiceDTO.invoiceItems = nil
			invoiceDTOs.append(invoiceDTO)
		}
		
		return invoiceDTOs
	}

	@Sendable
	func create(req: Request) async throws -> HTTPStatus {
		let invoiceDTO = try req.content.decode(InvoiceDTO.self)
		let invoiceItemDTOs = invoiceDTO.invoiceItemDTOs
		
		if (invoiceItemDTOs == nil || invoiceItemDTOs!.count == 0) { throw Abort(.badRequest) }
		
		var invoiceItems: [InvoiceItem] = []
		for invoiceItemDTO in invoiceItemDTOs!{
			invoiceItems.append(invoiceItemDTO.toModel())
		}
		
		let invoice = invoiceDTO.toModel()
		try await invoice.create(on: req.db)
		try await invoice.$invoiceItems.create(invoiceItems, on: req.db)
		
		return .ok
	}

	@Sendable
	func delete(req: Request) async throws -> HTTPStatus {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.notFound) }
		guard let invoiceID: UUID = req.parameters.get("invoiceID") else { throw Abort(.notFound) }
		
		guard let invoice = try await Invoice.query(on: req.db).filter(\.$id == invoiceID).filter(\.$customer.$id == customerID).first() else {
			throw Abort(.notFound)
		}
		
		if(invoice.status == InvoiceStatus.pending){
			invoice.status = InvoiceStatus.cancelled
		}else if(invoice.status == InvoiceStatus.packing){
			invoice.status = InvoiceStatus.pendingcancel
		}
		
		try await invoice.save(on: req.db)
		
		return .ok
	}
}

