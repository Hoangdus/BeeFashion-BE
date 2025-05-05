//
//  PushNotification.swift
//
//
//  Created by HoangDus on 03/05/2025.
//

import Foundation
import Dispatch
import OAuth2
import Vapor

func sendNotification(title: String, body: String, imageURL: String, req: Request, targetToken: String) async throws {
	let oAuthToken = try await OAuthToken.query(on: req.db).first()
	var accessToken: String = ""
	
	if(oAuthToken == nil){
		print("making new access token")
		let newAccessToken = try getOauth2Token()
		if(!newAccessToken.isEmpty){
			accessToken = newAccessToken
			try await OAuthToken(token: newAccessToken).save(on: req.db)
		}
	}else{
		let currentTime = Date()
		let oAuthTokenLastUpdateTime = oAuthToken!.updatedAt!
		let oAuthTokenLastUpdateTimeOffsetInSec: Double = 3480
		if(currentTime >= oAuthTokenLastUpdateTime.advanced(by: oAuthTokenLastUpdateTimeOffsetInSec)){
			print("refreshing access token")
			let newAccessToken = try getOauth2Token()
			accessToken = newAccessToken
			oAuthToken!.token = newAccessToken
			try await oAuthToken!.save(on: req.db)
		}else{
			accessToken = oAuthToken!.token
		}
	}
	
	let messageNotification = notification(
		title: title,
		body: body,
		image: imageURL
	)

	let payloadMessage = message(
		token: targetToken,
		notification: messageNotification
	)
	
	let url = URL(string: "https://fcm.googleapis.com/v1/projects/beefashion-93864/messages:send")!
	var request = URLRequest(url: url)
	request.httpMethod = "POST"
	request.setValue("application/json", forHTTPHeaderField: "Content-Type")
	request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
	let encoder = JSONEncoder()
	let payload = try encoder.encode(NotificationPayload(message: payloadMessage))
	request.httpBody = payload
	
	let _ = try await URLSession.shared.upload(for: request, from: payload)
}

func getOauth2Token() throws -> String{
	let scopes = ["https://www.googleapis.com/auth/firebase.messaging"]

	var accessToken: String?
	
	if let provider = DefaultTokenProvider(scopes: scopes) {
	  let sem = DispatchSemaphore(value: 0)
	  try provider.withToken() {(token, error) -> Void in
		if let token = token {
			accessToken = token.AccessToken
		}
		if let error = error {
		  print("ERROR \(error)")
		}
		sem.signal()
	  }
	  _ = sem.wait(timeout: DispatchTime.distantFuture)
	} else {
	  print("Unable to obtain an auth token.\nTry pointing GOOGLE_APPLICATION_CREDENTIALS to your service account credentials.")
	}
	
	if(accessToken != nil){
		return accessToken!
	}
	return ""
}

