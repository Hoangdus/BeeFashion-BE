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
        let manageInvoice = routes.grouped("admin","invoices")

		invoices.get(":customerID", use: self.index)
		invoices.post(use: self.create)
		
		invoices.group(":customerID",":invoiceID") { invoice in
			invoice.delete(use: self.delete)
		}
        
        manageInvoice.get(use: self.getAll)
	}
    
    @Sendable
    func getAll(req: Request) async throws -> [InvoiceDTO] {
        let invoices = try await Invoice.query(on: req.db).with(\.$invoiceItems).all()
        var invoiceDTOs: [InvoiceDTO] = []
        
        for invoice in invoices{
            let invoiceItems = invoice.invoiceItems
            var invoiceItemDTOs: [InvoiceItemDTO] = []
            
            for invoiceItem in invoiceItems {
                var invoiceItemDTO = invoiceItem.toDTO()
                let sizeDTO = try await Size.query(on: req.db).filter(\.$id == invoiceItem.$size.id).first()?.toDTO()
                let product = try await Product.query(on: req.db).filter(\.$id == invoiceItem.$product.id).with(\.$productDetail).first()
                if (product != nil){
                    let productDetail = product!.productDetail
                    if (productDetail != nil){
                        var productDTO = product!.toDTO()
                        productDTO.quantities = productDetail?.quantities
                        productDTO.price = productDetail?.price
                        invoiceItemDTO.product = productDTO
                        invoiceItemDTO.size = sizeDTO
                        invoiceItemDTOs.append(invoiceItemDTO)
                    }
                }
            }
            
            var invoiceDTO = invoice.toDTO()
            invoiceDTO.invoiceItems = nil
            invoiceDTO.invoiceItemDTOs = invoiceItemDTOs
            invoiceDTOs.append(invoiceDTO)
        }
        
        return invoiceDTOs
    }

	@Sendable
	func index(req: Request) async throws -> [InvoiceDTO] {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.notFound) }
		let invoices = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$customer.$id == customerID).all()
		var invoiceDTOs: [InvoiceDTO] = []
		
		for invoice in invoices{
			let invoiceItems = invoice.invoiceItems
			var invoiceItemDTOs: [InvoiceItemDTO] = []
			
			for invoiceItem in invoiceItems { 
				var invoiceItemDTO = invoiceItem.toDTO()
				let sizeDTO = try await Size.query(on: req.db).filter(\.$id == invoiceItem.$size.id).first()?.toDTO()
				let product = try await Product.query(on: req.db).filter(\.$id == invoiceItem.$product.id).with(\.$productDetail).first()
				if (product != nil){
					let productDetail = product!.productDetail
					if (productDetail != nil){
						var productDTO = product!.toDTO()
						productDTO.quantities = productDetail?.quantities
						productDTO.price = productDetail?.price
						invoiceItemDTO.product = productDTO
						invoiceItemDTO.size = sizeDTO
						invoiceItemDTOs.append(invoiceItemDTO)
					}
				}
			}
			
			var invoiceDTO = invoice.toDTO()
			invoiceDTO.invoiceItems = nil
			invoiceDTO.invoiceItemDTOs = invoiceItemDTOs
			invoiceDTOs.append(invoiceDTO)
		}
		
		return invoiceDTOs
	}

	@Sendable
	func create(req: Request) async throws -> HTTPStatus {
		let invoiceDTO = try req.content.decode(InvoiceDTO.self)
		let invoiceItemDTOs = invoiceDTO.invoiceItemDTOs
		
		if (invoiceItemDTOs == nil || invoiceItemDTOs!.count == 0) { throw Abort(.badRequest) }
	
		guard let _ = try await Customer.query(on: req.db).filter(\.$id == invoiceDTO.customerID).first() else {
			throw Abort(.notFound)
		}
		
		var invoiceItems: [InvoiceItem] = []
		for invoiceItemDTO in invoiceItemDTOs!{
			guard let _ = try await Product.query(on: req.db).filter(\.$id == invoiceItemDTO.productID).first() else {
				throw Abort(.notFound)
			}
			invoiceItems.append(invoiceItemDTO.toModel())
		}
		
		let invoice = invoiceDTO.toModel()
		try await invoice.create(on: req.db)
		try await invoice.$invoiceItems.create(invoiceItems, on: req.db)
		
		return .ok 
	}

	@Sendable
	func delete(req: Request) async throws -> HTTPStatus {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
		guard let invoiceID: UUID = req.parameters.get("invoiceID") else { throw Abort(.badRequest) }
		
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
    
    @Sendable
    func updateStatus(req: Request) async throws -> HTTPStatus {
        guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
        guard let invoiceID: UUID = req.parameters.get("invoiceID") else { throw Abort(.badRequest) }
        

        
        struct StatusUpdate: Content {
            let status: InvoiceStatus
        }
        
        let statusUpdate = try req.content.decode(StatusUpdate.self)
        let newStatus = statusUpdate.status
        
        guard let invoice = try await Invoice.query(on: req.db).filter(\.$id == invoiceID).filter(\.$customer.$id == customerID).first() else {
            throw Abort(.notFound)
        }
        
        guard isValidStatusTransition(from: invoice.status, to: newStatus) else {
            throw Abort(.badRequest)
        }
        
        invoice.status = newStatus
        try await invoice.save(on: req.db)
        
        return .ok
    }
    
    private func isValidStatusTransition(from current: InvoiceStatus, to new: InvoiceStatus) -> Bool {
        switch current {
        case .pending:
            return [.packing, .cancelled].contains(new)
        case .packing:
            return [.intransit, .pendingcancel].contains(new)
        case .intransit:
            return [.completed, .returned].contains(new)
        case .pendingcancel:
            return [.cancelled].contains(new)
        case .completed, .returned, .cancelled:
            return false
        }
    }
}

