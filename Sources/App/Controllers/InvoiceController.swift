//
//  InvoiceController.swift
//
//
//  Created by HoangDus on 11/03/2025.
//

import Fluent
import Vapor

struct InvoiceFilter: Content{
    let fromDate: String
    let toDate: String
    let status: InvoiceStatus?
}

struct InvoiceController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let invoices = routes.grouped("invoices")
        let manageInvoice = routes.grouped("admin","invoices")
        
        invoices.get(":customerID", use: self.index)
        invoices.post(use: self.create)
        
        invoices.group(":customerID",":invoiceID") { invoice in
            invoice.delete(use: self.customerCancelInvoice)
			invoice.patch(use: self.customerCompleteInvoice)
        }
        
        manageInvoice.group(":customerID",":invoiceID") { invoice in
            invoice.patch(use: self.updateStatus)
            invoice.get(use: self.getInvoiceByCustomerID)
        }
        
        manageInvoice.get(use: self.getAll)
    }
    
    //filter: {URL}/admin/invoices?fromDate="yyyy-mm-dd"&toDate="yyyy-mm-dd"&status=pending(optional)
    //no filter: {URL}/admin/invoices?fromDate=&toDate=
    //return a list of all customers invoice
    @Sendable
    func getAll(req: Request) async throws -> [InvoiceDTO] {
        let filter = try req.query.decode(InvoiceFilter.self)
        
        var invoices: [Invoice] = []
        
        //invoice filter
        if(filter.status != nil){
            if (!filter.toDate.isEmpty && !filter.fromDate.isEmpty){
                
                let fromDateISOString: String = "\(filter.fromDate)T00:00:00+00:00"
                let toDateISOString: String = "\(filter.toDate)T23:59:59+00:00"
                
                let fromDate = ISO8601DateFormatter().date(from: fromDateISOString)
                let toDate = ISO8601DateFormatter().date(from: toDateISOString)
                
                invoices = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$createdAt >= fromDate).filter(\.$createdAt <= toDate).filter(\.$status == filter.status!).all()
            }else{
                invoices = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$status == filter.status!).all()
            }
        }else{
            if (!filter.toDate.isEmpty && !filter.fromDate.isEmpty){
                
                let fromDateISOString: String = "\(filter.fromDate)T00:00:00+00:00"
                let toDateISOString: String = "\(filter.toDate)T23:59:59+00:00"
                
                let fromDate = ISO8601DateFormatter().date(from: fromDateISOString)
                let toDate = ISO8601DateFormatter().date(from: toDateISOString)
                
                invoices = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$createdAt >= fromDate).filter(\.$createdAt <= toDate).all()
            }else{
                invoices = try await Invoice.query(on: req.db).with(\.$invoiceItems).all()
            }
        }
        
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
			invoiceDTO.targetDeviceToken = ""
            invoiceDTO.invoiceItemDTOs = invoiceItemDTOs
            invoiceDTOs.append(invoiceDTO)
        }
        
        return invoiceDTOs
    }
    
    @Sendable
    func create(req: Request) async throws -> HTTPStatus {
        var invoiceDTO = try req.content.decode(InvoiceDTO.self)
        let invoiceItemDTOs = invoiceDTO.invoiceItemDTOs
        
        if (invoiceItemDTOs == nil || invoiceItemDTOs!.count == 0) { throw Abort(.badRequest) }
        
        guard let _ = try await Customer.query(on: req.db).filter(\.$id == invoiceDTO.customerID).first() else {
            throw Abort(.notFound, reason: "customer not found")
        }
        
        guard let address = try await Address.query(on: req.db).filter(\.$id == invoiceDTO.addressID).first() else {
            throw Abort(.notFound, reason: "address not found")
        }
        
        var invoiceItems: [InvoiceItem] = []
        for invoiceItemDTO in invoiceItemDTOs!{
            guard let _ = try await Product.query(on: req.db).filter(\.$id == invoiceItemDTO.productID).first() else {
                throw Abort(.notFound, reason: "product \(invoiceItemDTO.productID) not found")
            }
            
            //reduce stock
            guard let productDetail = try await ProductDetail.query(on: req.db).withDeleted().with(\.$sizes).filter(\.$product.$id == invoiceItemDTO.productID).first() else { throw Abort(.notFound) }
            let sizeIndex = productDetail.sizes.firstIndex{ $0.id == invoiceItemDTO.sizeID }
            var quantities = productDetail.quantities
            if(invoiceItemDTO.quantity <= quantities[sizeIndex!]){
                quantities[sizeIndex!] = quantities[sizeIndex!] - invoiceItemDTO.quantity
            }else{
                throw Abort(.badRequest, reason: "not enough stock, only \(quantities[sizeIndex!]) avaliable")
            }
            productDetail.quantities = quantities
            try await productDetail.save(on: req.db)
            
            //add invoiceItem to invoice
            invoiceItems.append(invoiceItemDTO.toModel())
        }
        
        invoiceDTO.fullAddress = "\(address.detail) \(address.ward) \(address.district) \(address.province)"
		invoiceDTO.recipientName = address.name
		invoiceDTO.recipientPhoneNumber = address.phoneNumber
        let invoice = invoiceDTO.toModel()
        try await invoice.create(on: req.db)
        try await invoice.$invoiceItems.create(invoiceItems, on: req.db)
        
        return .ok
    }
    
    @Sendable
    func getInvoiceByCustomerID(req: Request) async throws -> InvoiceDTO {
        guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
        guard let invoiceID: UUID = req.parameters.get("invoiceID") else { throw Abort(.badRequest) }
        
        guard let invoice = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$id == invoiceID).filter(\.$customer.$id == customerID).first() else {
            throw Abort(.notFound, reason: "invoice not found")
        }
        
        return invoice.toDTO()
    }
    
    @Sendable
    func customerCancelInvoice(req: Request) async throws -> HTTPStatus {
        guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
        guard let invoiceID: UUID = req.parameters.get("invoiceID") else { throw Abort(.badRequest) }
        
        guard let invoice = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$id == invoiceID).filter(\.$customer.$id == customerID).first() else {
            throw Abort(.notFound, reason: "invoice not found")
        }
        
        if(invoice.status == InvoiceStatus.pending){
            invoice.status = InvoiceStatus.cancelled
            
            //restore stock when cancel
            for invoiceItem in invoice.invoiceItems{
                guard let productDetail = try await ProductDetail.query(on: req.db).withDeleted().with(\.$sizes).filter(\.$product.$id == invoiceItem.$product.id).first() else { throw Abort(.notFound) }
                let sizeIndex = productDetail.sizes.firstIndex{ $0.id == invoiceItem.$size.id }
                var quantities = productDetail.quantities
                quantities[sizeIndex!] = quantities[sizeIndex!] + invoiceItem.quantity
                productDetail.quantities = quantities
                try await productDetail.save(on: req.db)
            }
        }else if(invoice.status == InvoiceStatus.packing){
            invoice.status = InvoiceStatus.pendingcancel
        }
        
        try await invoice.save(on: req.db)
        
        return .ok
    }
    
    @Sendable
    func customerCompleteInvoice(req: Request) async throws -> HTTPStatus {
        guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
        guard let invoiceID: UUID = req.parameters.get("invoiceID") else { throw Abort(.badRequest) }
        
        guard let invoice = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$id == invoiceID).filter(\.$customer.$id == customerID).first() else {
            throw Abort(.notFound, reason: "invoice not found")
        }
        
        if(invoice.status == InvoiceStatus.intransit){
            invoice.status = InvoiceStatus.completed
            try await invoice.save(on: req.db)
            return .ok
        }
        
        throw Abort(.notAcceptable, reason: "Invoice is \(invoice.status)")
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
        
        guard let invoice = try await Invoice.query(on: req.db)
            .with(\.$invoiceItems)
            .filter(\.$id == invoiceID)
            .filter(\.$customer.$id == customerID)
            .first() else {
            throw Abort(.notFound)
        }
        
        guard isValidStatusTransition(from: invoice.status, to: newStatus) else {
            throw Abort(.badRequest)
        }
        
        if (invoice.status == .pending || invoice.status == .pendingcancel || invoice.status == .packing ) && newStatus == .cancelled {
            //restore stock when cancel
            for invoiceItem in invoice.invoiceItems{
                guard let productDetail = try await ProductDetail.query(on: req.db).withDeleted().with(\.$sizes).filter(\.$product.$id == invoiceItem.$product.id).first() else { throw Abort(.notFound) }
                let sizeIndex = productDetail.sizes.firstIndex{ $0.id == invoiceItem.$size.id }
                var quantities = productDetail.quantities
                quantities[sizeIndex!] = quantities[sizeIndex!] + invoiceItem.quantity
                productDetail.quantities = quantities
                try await productDetail.save(on: req.db)
            }
        }
        
		if (invoice.status == .pending){
			try await sendNotification(title: "Trạng thái đơn hàng", body: "Đơn hàng \(invoice.id!.uuidString.prefix(6)) của bạn đang được đóng gói", imageURL: "", req: req, targetToken: invoice.targetDeviceToken)
		}else if(invoice.status == .intransit){
			try await sendNotification(title: "Trạng thái đơn hàng", body: "Đơn hàng \(invoice.id!.uuidString.prefix(6)) của bạn đang được giao", imageURL: "", req: req, targetToken: invoice.targetDeviceToken)
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
                return [.cancelled, .packing].contains(new)
            case .completed, .returned, .cancelled:
                return false
        }
    }
}
