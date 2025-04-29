//
//  ProductController.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import FluentMongoDriver
import Vapor

struct QueryParam: Content{
	let name: String?
}

struct ProductController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let products = routes.grouped("products")
        let manageRoute = routes.grouped("admin", "products")
        
        products.group(":customerId"){
            $0.get(use: self.index)
        }
        products.get(use: self.index)
        
        //		products.group("images"){ product in
        //			product.post(use: uploadImages)
        //		}
        
        manageRoute.get(use: self.getAll)
        manageRoute.post(use: self.create)
        manageRoute.group(":productID") { product in
            product.put(use: self.update)
            product.patch(use: self.restore)
            product.delete(use: self.delete)
        }
    }
    
    //    @Sendable
    //	func uploadImages(req: Request) async throws -> HTTPStatus {
    //		struct Input: Content {
    //			var files: [File]
    //		}
    //
    //		let input = try req.content.decode(Input.self)
    //
    //		let formatter = DateFormatter()
    //		formatter.dateFormat = "dd-MM-yyyy HH:mm:ss"
    //		let prefix = formatter.string(from: .init())
    //
    //		for (_, value) in input.files.enumerated() {
    //			let imageFileName = "image \(prefix) \(value.filename)"
    //			try await req.fileio.writeFile(value.data, at: "Public/images/\(imageFileName)")
    //		}
    //
    //		return .ok
    //	}
    
    @Sendable
    func index(req: Request) async throws -> [ProductDTO] {
        let customer = try await Customer.find(req.parameters.get("customerId"), on: req.db)
        let products = try await Product.query(on: req.db).with(\.$productDetail).all()
        var productDTOs: [ProductDTO] = []
        
        // add child properties to parent
        for product in products{
            let productDetail = product.productDetail
            if (productDetail != nil){
                var productDTO = product.toDTO()
                productDTO.quantities = productDetail?.quantities
                productDTO.price = productDetail?.price
                if(customer != nil){
                    productDTO.isFavByCurrentUser = try await product.$customers.isAttached(to: customer!, on: req.db)
                }
                productDTOs.append(productDTO)
            }
        }
        
        return productDTOs
    }
    
    @Sendable
    func getAll(req: Request) async throws -> [ProductDTO] {
		let products = try await Product.query(on: req.db).withDeleted().with(\.$productDetail).with(\.$manager).all()
        var productDTOs: [ProductDTO] = []
        
        // add child properties to parent
        for product in products{
            let productDetail = product.productDetail
			let manager = product.manager.toDTO()
            var productDTO = product.toDTO()
            productDTO.quantities = productDetail?.quantities
            productDTO.price = productDetail?.price
			productDTO.manager = manager
            productDTOs.append(productDTO)
        }
        
        return productDTOs
    }
    
    
    @Sendable
    func create(req: Request) async throws -> ProductDTO {
        let productDTO = try req.content.decode(ProductDTO.self)
		let normalizedProductName = productDTO.name?.folding(options: .diacriticInsensitive, locale: .none).lowercased()
		let product = productDTO.toModel(normalizedName: normalizedProductName!)

		guard let _ = try await Category.find(productDTO.categoryId, on: req.db) else {
			throw Abort(.notFound, reason: "category not found")
		}
		
		guard let _ = try await Brand.find(productDTO.brandID, on: req.db) else {
			throw Abort(.notFound, reason: "brand not found")
		}
		
		guard let manager = try await Manager.find(productDTO.managerID, on: req.db) else {
			throw Abort(.notFound, reason: "manager not found")
		}
		
		struct Input: Content {
            var image: File
        }
        
        let input = try req.content.decode(Input.self)
        
        let isImage = ["png", "jpeg", "jpg", "gif"].contains(input.image.extension?.lowercased())
        if (!isImage){
            throw Abort(.badRequest)
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "dd-MM-yyyy-HH:mm:ss"
        let prefix = formatter.string(from: .init())
        
        let imageFileName = "image-\(prefix)-\(input.image.filename)"
        try await req.fileio.writeFile(input.image.data, at: "Public/images/\(imageFileName)")
        
        product.image = "\(Environment.get("IMAGE_URL") ?? "http://127.0.0.1:8080/images/")\(imageFileName)"
									
		try await manager.$products.create(product, on: req.db)
        return product.toDTO()
    }
    
    @Sendable
    func update(req: Request) async throws -> ProductDTO {
		struct Input: Content {
			var image: File?
		}
		let input = try req.content.decode(Input.self)
		
		let newProductDataDTO = try req.content.decode(ProductDTO.self)
		
        guard let productID: UUID = req.parameters.get("productID") else { throw Abort(.badRequest) }
        guard let product = try await Product.query(on: req.db).with(\.$category).filter(\.$id == productID).first() else { throw Abort(.notFound) }
        
		var imageUrl = product.image
//        let _ = product.image //TODO delete old image
        
        if let newImage = input.image {
            let isImage = ["png", "jpeg", "jpg", "gif"].contains(newImage.extension?.lowercased())
            if !isImage {
                throw Abort(.badRequest)
            }
            
            let formatter = DateFormatter()
            formatter.dateFormat = "dd-MM-yyyy-HH:mm:ss"
            let prefix = formatter.string(from: .init())
            
            let imageFileName = "image-\(prefix)-\(newImage.filename)"
            try await req.fileio.writeFile(newImage.data, at: "Public/images/\(imageFileName)")
            imageUrl = "\(Environment.get("IMAGE_URL") ?? "http://127.0.0.1:8080/images/")\(imageFileName)"
        }
        
//        product.name = newProductData.name
//        product.image = imageUrl
//        product.$category.id = newProductData.$category.id
        
        if let name = newProductDataDTO.name {
            product.name = name
			let normalizedProductName = name.folding(options: .diacriticInsensitive, locale: .none).lowercased()
			product.normalizedName = normalizedProductName
        }
		
        if let categoryID = newProductDataDTO.categoryId {
            product.$category.id = categoryID
        }
        product.image = imageUrl
        
        try await product.save(on: req.db)
        return product.toDTO()
    }
    
    @Sendable
    func restore(req: Request) async throws -> HTTPStatus {
        guard let productID: UUID = req.parameters.get("productID") else { throw Abort(.badRequest) }
        guard let product = try await Product.query(on: req.db).withDeleted().filter(\.$id == productID).first() else { throw Abort(.notFound) }
        
        try await product.restore(on: req.db)
        return .noContent
    }
    
    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let product = try await Product.find(req.parameters.get("productID"), on: req.db) else {
            throw Abort(.notFound)
        }
        
        try await product.delete(on: req.db)
        return .noContent
    }
}
