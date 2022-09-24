import List "mo:base/List";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Time "mo:base/Time";

actor {
  type Message = {
    text: Text;
    time: Time.Time;
    author: ?Text;
  };

  public type Microblog = actor {
    follow: shared(Principal) -> async ();
    follows: shared query () -> async [Principal];
    reset_follow: shared() -> async ();
    post: shared (Text) -> async ();
    posts: shared query (Time.Time) -> async [Message];
    timeline: shared (Time.Time) -> async [Message];
    set_name: shared (Text) -> async ();
    get_name: shared query () -> async (Text);
  };

  stable var myname: ?Text = null;

  public shared func set_name(name: Text) : async () {
    myname := ?name;
  };

  public shared func get_name() : async ?Text {
    myname
  };

  stable var followed: List.List<Principal> = List.nil();

  public shared func follow(id: Principal) : async () {
    followed := List.push(id, followed);
  };

  public shared query func follows() : async [Principal] {
    List.toArray(followed)
  };

  public shared func reset_follow() : async () {
    followed := List.nil();
  };

  stable var messages : List.List<Message> = List.nil();

  public shared (msg) func post(otp: Text, text: Text) : async () {
    assert(otp == "123456");
    let newMsg = {
      text = text;
      time = Time.now();
      author = myname;
    };
    messages := List.push(newMsg, messages)
  };

  public shared query func posts(since: Time.Time) : async [Message] {
    var afterMsgs : List.List<Message> = List.nil();
    for (msg in Iter.fromList(messages)) {
      let time = msg.time;
      if (time >= since) {
        afterMsgs := List.push(msg, afterMsgs);
      };
    };
    List.toArray(afterMsgs)
  };

  public shared func timeline(since: Time.Time) : async [Message] {
    var all : List.List<Message> = List.nil();

    for (id in Iter.fromList(followed)) {
      let canister : Microblog = actor(Principal.toText(id));
      let msgs = await canister.posts(since);
      for (msg in Iter.fromArray(msgs)) {
        all := List.push(msg, all)
      }
    };

    List.toArray(all)
  };
};
